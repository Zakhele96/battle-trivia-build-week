using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/word-scramble/settings")]
public sealed class AdminWordScrambleSettingsController : ControllerBase
{
    private readonly AdminWordScrambleSettingsService _adminWordScrambleSettingsService;

    public AdminWordScrambleSettingsController(AdminWordScrambleSettingsService adminWordScrambleSettingsService)
    {
        _adminWordScrambleSettingsService = adminWordScrambleSettingsService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        if (!IsAdmin()) return Forbid();

        var result = await _adminWordScrambleSettingsService.GetAsync();
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateWordScrambleSettingsRequest request)
    {
        if (!IsAdmin()) return Forbid();

        var result = await _adminWordScrambleSettingsService.UpdateAsync(request);
        return Ok(result);
    }

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}
