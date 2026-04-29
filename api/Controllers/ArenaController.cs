using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/rooms/{roomId:guid}/arena")]
public sealed class ArenaController : ControllerBase
{
    private readonly ArenaService _arenaService;

    public ArenaController(ArenaService arenaService)
    {
        _arenaService = arenaService;
    }

    [HttpGet("challenges")]
    public async Task<IActionResult> GetChallenges(Guid roomId, [FromQuery] string bucket = "all", [FromQuery] int take = 50)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var rows = await _arenaService.GetChallengesAsync(roomId, userId, bucket, take);
        return Ok(rows);
    }

    [HttpGet("challenges/{challengeId:guid}")]
    public async Task<IActionResult> GetChallenge(Guid roomId, Guid challengeId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var challenge = await _arenaService.GetChallengeDetailAsync(roomId, challengeId, userId);
        if (challenge is null)
            return NotFound();

        return Ok(challenge);
    }

    [HttpPost("challenges")]
    public async Task<IActionResult> CreateChallenge(Guid roomId, [FromBody] CreateArenaChallengeRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        try
        {
            var result = await _arenaService.CreateChallengeAsync(roomId, userId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("challenges/{challengeId:guid}/entries")]
    public async Task<IActionResult> SubmitEntry(Guid roomId, Guid challengeId, [FromBody] CreateArenaEntryRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        try
        {
            var result = await _arenaService.SubmitEntryAsync(roomId, challengeId, userId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("challenges/{challengeId:guid}/vote")]
    public async Task<IActionResult> Vote(Guid roomId, Guid challengeId, [FromBody] VoteArenaEntryRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        try
        {
            var result = await _arenaService.VoteAsync(roomId, challengeId, userId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("challenges/{challengeId:guid}/comments")]
    public async Task<IActionResult> CreateComment(Guid roomId, Guid challengeId, [FromBody] CreateArenaCommentRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        try
        {
            var result = await _arenaService.CreateCommentAsync(roomId, challengeId, userId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("hall-of-bars")]
    public async Task<IActionResult> GetHallOfBars(Guid roomId, [FromQuery] int take = 20)
    {
        var rows = await _arenaService.GetHallOfBarsAsync(roomId, take);
        return Ok(rows);
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard(Guid roomId, [FromQuery] int take = 20)
    {
        var rows = await _arenaService.GetLeaderboardAsync(roomId, take);
        return Ok(rows);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var value =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        return Guid.TryParse(value, out userId);
    }
}
