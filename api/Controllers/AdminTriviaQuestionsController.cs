using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/trivia-questions")]
public sealed class AdminTriviaQuestionsController : ControllerBase
{
    private readonly AdminTriviaQuestionService _adminTriviaQuestionService;
    private readonly AiTriviaQuestionStudioService _aiTriviaQuestionStudioService;

    public AdminTriviaQuestionsController(
        AdminTriviaQuestionService adminTriviaQuestionService,
        AiTriviaQuestionStudioService aiTriviaQuestionStudioService)
    {
        _adminTriviaQuestionService = adminTriviaQuestionService;
        _aiTriviaQuestionStudioService = aiTriviaQuestionStudioService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] string? difficulty,
        [FromQuery] bool? isActive)
    {
        if (!IsAdmin()) return Forbid();

        var rows = await _adminTriviaQuestionService.GetAllAsync(category, difficulty, isActive);
        return Ok(rows);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var row = await _adminTriviaQuestionService.GetByIdAsync(id);
        if (row is null) return NotFound();

        return Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTriviaQuestionRequest request)
    {
        if (!IsAdmin()) return Forbid();

        var row = await _adminTriviaQuestionService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = row.Id }, row);
    }

    [HttpPost("ai/generate")]
    [EnableRateLimiting("ai-admin-generation")]
    public async Task<IActionResult> GenerateWithAi(
        [FromBody] GenerateTriviaQuestionsRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin()) return Forbid();

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized(new { message = "Unauthorized." });

        try
        {
            var result = await _aiTriviaQuestionStudioService.GenerateAsync(
                request,
                userId,
                cancellationToken);
            return Ok(result);
        }
        catch (AiQuestionGenerationUnavailableException exception)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = exception.Message });
        }
    }

    [HttpPost("ai/save")]
    public async Task<IActionResult> SaveGeneratedQuestions(
        [FromBody] SaveGeneratedTriviaQuestionsRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin()) return Forbid();

        var result = await _aiTriviaQuestionStudioService.SaveAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTriviaQuestionRequest request)
    {
        if (!IsAdmin()) return Forbid();

        var row = await _adminTriviaQuestionService.UpdateAsync(id, request);
        if (row is null) return NotFound();

        return Ok(row);
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromQuery] bool isActive)
    {
        if (!IsAdmin()) return Forbid();

        var updated = await _adminTriviaQuestionService.SetActiveAsync(id, isActive);
        if (!updated) return NotFound();

        return NoContent();
    }

    [HttpPatch("active/bulk")]
    public async Task<IActionResult> SetActiveBulk(
        [FromQuery] bool isActive,
        [FromQuery] string? category,
        [FromQuery] string? difficulty,
        [FromQuery] bool? currentIsActive)
    {
        if (!IsAdmin()) return Forbid();

        var affected = await _adminTriviaQuestionService.SetActiveByFilterAsync(
            isActive,
            category,
            difficulty,
            currentIsActive);

        return Ok(new { affected });
    }

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}
