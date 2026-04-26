using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/leaderboard-sponsors")]
public sealed class AdminLeaderboardSponsorsController : ControllerBase
{
    private readonly AdminLeaderboardSponsorService _adminLeaderboardSponsorService;

    public AdminLeaderboardSponsorsController(
        AdminLeaderboardSponsorService adminLeaderboardSponsorService)
    {
        _adminLeaderboardSponsorService = adminLeaderboardSponsorService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LeaderboardSponsorResponse>>> Get()
    {
        if (!IsAdmin()) return Forbid();

        var result = await _adminLeaderboardSponsorService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<LeaderboardSponsorResponse>> Create(
        [FromBody] UpsertLeaderboardSponsorRequest request)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var result = await _adminLeaderboardSponsorService.CreateAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LeaderboardSponsorResponse>> Update(
        Guid id,
        [FromBody] UpsertLeaderboardSponsorRequest request)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var result = await _adminLeaderboardSponsorService.UpdateAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<ActionResult<LeaderboardSponsorResponse>> SetActive(
        Guid id,
        [FromQuery] bool isActive)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var result = await _adminLeaderboardSponsorService.SetActiveAsync(id, isActive);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}
