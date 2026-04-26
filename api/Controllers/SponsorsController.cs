using Bts.Api.Models.Responses;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sponsors")]
public sealed class SponsorsController : ControllerBase
{
    private readonly LeaderboardSponsorService _leaderboardSponsorService;

    public SponsorsController(LeaderboardSponsorService leaderboardSponsorService)
    {
        _leaderboardSponsorService = leaderboardSponsorService;
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<LeaderboardSponsorResponse?>> GetActive([FromQuery] string mode)
    {
        try
        {
            var result = await _leaderboardSponsorService.GetActiveAsync(mode);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
