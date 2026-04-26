using System.Security.Claims;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/growth")]
public sealed class AdminGrowthController : ControllerBase
{
    private readonly GrowthAnalyticsService _growthAnalyticsService;

    public AdminGrowthController(GrowthAnalyticsService growthAnalyticsService)
    {
        _growthAnalyticsService = growthAnalyticsService;
    }

    [HttpGet("snapshot")]
    public async Task<IActionResult> GetSnapshot()
    {
        if (!IsAdmin()) return Forbid();

        var snapshot = await _growthAnalyticsService.GetAdminSnapshotAsync();
        return Ok(snapshot);
    }

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}
