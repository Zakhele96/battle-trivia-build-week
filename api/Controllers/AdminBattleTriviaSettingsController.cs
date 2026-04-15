using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/battle-trivia/settings")]
public sealed class AdminBattleTriviaSettingsController : ControllerBase
{
    private readonly AdminBattleTriviaSettingsService _adminBattleTriviaSettingsService;

    public AdminBattleTriviaSettingsController(AdminBattleTriviaSettingsService adminBattleTriviaSettingsService)
    {
        _adminBattleTriviaSettingsService = adminBattleTriviaSettingsService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        if (!IsAdmin()) return Forbid();

        var result = await _adminBattleTriviaSettingsService.GetAsync();
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateBattleTriviaSettingsRequest request)
    {
        if (!IsAdmin()) return Forbid();

        var result = await _adminBattleTriviaSettingsService.UpdateAsync(request);
        return Ok(result);
    }

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}