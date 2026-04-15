using System.Security.Claims;
using Bts.Api.Models.Dtos;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Route("api/battle-trivia/session-summary")]
public sealed class BattleTriviaSessionSummaryController : ControllerBase
{
    private readonly BattleTriviaSessionSummaryService _battleTriviaSessionSummaryService;

    public BattleTriviaSessionSummaryController(
        BattleTriviaSessionSummaryService battleTriviaSessionSummaryService)
    {
        _battleTriviaSessionSummaryService = battleTriviaSessionSummaryService;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<BattleTriviaSessionSummaryDto>> GetMine()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var summary = await _battleTriviaSessionSummaryService.GetLatestForUserAsync(userId);
        return Ok(summary);
    }

    [HttpGet("podium")]
    public async Task<ActionResult<BattleTriviaWeeklyPodiumDto>> GetLatestPodium()
    {
        var podium = await _battleTriviaSessionSummaryService.GetLatestPodiumAsync();
        return Ok(podium);
    }
}