using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/rooms/{roomId:guid}/battle-it")]
public sealed class BattleItController : ControllerBase
{
    private readonly BattleItService _battleItService;

    public BattleItController(BattleItService battleItService)
    {
        _battleItService = battleItService;
    }

    [HttpGet("state")]
    public async Task<IActionResult> GetState(Guid roomId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.GetStateAsync(roomId, userId));
    }

    [HttpGet("public-sessions")]
    public async Task<IActionResult> GetPublicSessions(Guid roomId)
    {
        if (!TryGetUserId(out _))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.GetPublicSessionsAsync(roomId));
    }

    [HttpPost("generate")]
    [EnableRateLimiting("ai-battle-it-generation")]
    [RequestSizeLimit(13 * 1024 * 1024)]
    public async Task<IActionResult> Generate(
        Guid roomId,
        [FromForm] string? sourceText,
        [FromForm] string difficulty = "medium",
        [FromForm] string answerMode = "text",
        [FromForm] string visibility = "code-only",
        [FromForm] int questionDurationSeconds = 20,
        [FromForm] int revealDelaySeconds = 5,
        [FromForm] List<IFormFile>? images = null,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        try
        {
            var uploadedImages = new List<BattleItUploadedImage>();
            foreach (var image in images ?? [])
            {
                await using var stream = new MemoryStream();
                await image.CopyToAsync(stream, cancellationToken);
                uploadedImages.Add(new BattleItUploadedImage
                {
                    FileName = Path.GetFileName(image.FileName),
                    ContentType = image.ContentType?.Trim().ToLowerInvariant() ?? string.Empty,
                    Bytes = stream.ToArray()
                });
            }

            var state = await _battleItService.GenerateAsync(
                roomId,
                userId,
                sourceText,
                uploadedImages,
                difficulty,
                answerMode,
                visibility,
                questionDurationSeconds,
                revealDelaySeconds,
                cancellationToken);
            return Ok(state);
        }
        catch (AiQuestionGenerationUnavailableException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    [HttpPut("sessions/{sessionId:guid}")]
    public async Task<IActionResult> UpdateDraft(
        Guid roomId,
        Guid sessionId,
        [FromBody] UpdateBattleItDraftRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.UpdateDraftAsync(roomId, sessionId, userId, request));
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join(Guid roomId, [FromBody] JoinBattleItRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.JoinAsync(roomId, userId, request));
    }

    [HttpPost("sessions/{sessionId:guid}/join")]
    public async Task<IActionResult> JoinPublic(Guid roomId, Guid sessionId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.JoinPublicAsync(roomId, sessionId, userId));
    }

    [HttpPost("sessions/{sessionId:guid}/open")]
    public async Task<IActionResult> OpenLobby(Guid roomId, Guid sessionId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.OpenLobbyAsync(roomId, sessionId, userId));
    }

    [HttpPost("sessions/{sessionId:guid}/start")]
    public async Task<IActionResult> Start(Guid roomId, Guid sessionId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.StartAsync(roomId, sessionId, userId));
    }

    [HttpPost("sessions/{sessionId:guid}/replay")]
    public async Task<IActionResult> Replay(Guid roomId, Guid sessionId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        return await ExecuteAsync(() => _battleItService.ReplayAsync(roomId, sessionId, userId));
    }

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        try
        {
            return Ok(await action());
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out userId);
    }
}
