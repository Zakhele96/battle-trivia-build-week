using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class SquadsController : ControllerBase
{
    private readonly SquadService _squadService;

    public SquadsController(SquadService squadService)
    {
        _squadService = squadService;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        var squads = await _squadService.GetMineAsync(userId.Value);
        return Ok(squads);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSquadRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var squad = await _squadService.CreateAsync(userId.Value, request);
            return Ok(squad);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinSquadRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var squad = await _squadService.JoinAsync(userId.Value, request);
            return Ok(squad);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{squadId:guid}")]
    public async Task<IActionResult> GetDetail(
        Guid squadId,
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current")
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var squad = await _squadService.GetDetailAsync(userId.Value, squadId, mode, period);
            return Ok(squad);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
