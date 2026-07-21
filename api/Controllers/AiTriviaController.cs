using System.Security.Claims;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ai/trivia")]
public sealed class AiTriviaController : ControllerBase
{
    private readonly ITriviaExplanationService _triviaExplanationService;

    public AiTriviaController(ITriviaExplanationService triviaExplanationService)
    {
        _triviaExplanationService = triviaExplanationService;
    }

    [HttpPost("rounds/{roundId:guid}/explanation")]
    [EnableRateLimiting("ai-explanations")]
    public async Task<IActionResult> GetOrGenerateExplanation(
        Guid roundId,
        CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized(new { message = "Unauthorized." });

        try
        {
            var result = await _triviaExplanationService.GetOrGenerateAsync(
                roundId,
                userId,
                cancellationToken);
            return Ok(result);
        }
        catch (TriviaRoundNotFoundException)
        {
            return NotFound(new { message = "Trivia round or question not found." });
        }
        catch (TriviaRoundNotEndedException)
        {
            return Conflict(new { message = "The answer can only be explained after the round ends." });
        }
        catch (TriviaExplanationUnavailableException exception)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = exception.Message });
        }
    }
}
