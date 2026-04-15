using Bts.Api.Models.Dtos;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class LeaderboardsController : ControllerBase
{
    private readonly GameLeaderboardService _gameLeaderboardService;

    public LeaderboardsController(GameLeaderboardService gameLeaderboardService)
    {
        _gameLeaderboardService = gameLeaderboardService;
    }

    [HttpGet("{mode}")]
    public async Task<ActionResult<GameLeaderboardDto>> Get(
        string mode,
        [FromQuery] string period = "current",
        [FromQuery] int take = 100)
    {
        take = Math.Clamp(take, 1, 200);

        try
        {
            var result = await _gameLeaderboardService.GetAsync(mode, period, take);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}