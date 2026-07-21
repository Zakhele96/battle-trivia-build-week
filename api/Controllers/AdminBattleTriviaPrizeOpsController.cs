using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/battle-trivia/prize-ops")]
public sealed class AdminBattleTriviaPrizeOpsController : ControllerBase
{
    private readonly AdminBattleTriviaPrizeOpsService _prizeOpsService;

    public AdminBattleTriviaPrizeOpsController(AdminBattleTriviaPrizeOpsService prizeOpsService)
    {
        _prizeOpsService = prizeOpsService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminBattleTriviaPrizeSessionResponse>>> GetRecent(
        [FromQuery] int takeSessions = 6)
    {
        if (!IsAdmin()) return Forbid();

        var result = await _prizeOpsService.GetRecentAsync(takeSessions);
        return Ok(result);
    }

    [HttpPut("{sessionId:guid}/winners/{userId:guid}")]
    public async Task<ActionResult<AdminBattleTriviaPrizePayoutResponse>> Update(
        Guid sessionId,
        Guid userId,
        [FromBody] UpdateBattleTriviaPrizePayoutRequest request)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var result = await _prizeOpsService.UpdateAsync(sessionId, userId, request);
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

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}
