using System.Security.Claims;
using Bts.Api.Models.Dtos;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Route("api/battle-trivia/profile-stats")]
[Authorize]
public sealed class BattleTriviaProfileStatsController : ControllerBase
{
    private readonly BattleTriviaProfileStatsService _battleTriviaProfileStatsService;

    public BattleTriviaProfileStatsController(
        BattleTriviaProfileStatsService battleTriviaProfileStatsService)
    {
        _battleTriviaProfileStatsService = battleTriviaProfileStatsService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<BattleTriviaProfileStatsDto>> GetMine()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var stats = await _battleTriviaProfileStatsService.GetForUserAsync(userId);
        return Ok(stats);
    }
}