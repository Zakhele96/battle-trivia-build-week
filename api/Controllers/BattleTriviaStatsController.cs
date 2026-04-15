using Bts.Api.Repositories;
using Bts.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Route("api/battle-trivia")]
public sealed class BattleTriviaStatsController : ControllerBase
{
    private const string BattleTriviaSlug = "battle-trivia";

    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;
    private readonly TriviaLeaderboardService _triviaLeaderboardService;

    public BattleTriviaStatsController(
        IRoomRepository roomRepository,
        ITriviaSessionRepository triviaSessionRepository,
        TriviaLeaderboardService triviaLeaderboardService)
    {
        _roomRepository = roomRepository;
        _triviaSessionRepository = triviaSessionRepository;
        _triviaLeaderboardService = triviaLeaderboardService;
    }

    [HttpGet("current-leaderboard")]
    public async Task<IActionResult> GetCurrentLeaderboard([FromQuery] int take = 3)
    {
        take = Math.Clamp(take, 1, 10);

        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
            return Ok(Array.Empty<object>());

        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
            return Ok(Array.Empty<object>());

        var rows = await _triviaLeaderboardService.GetSessionLeaderboardAsync(session.Id, take);
        return Ok(rows);
    }
}