using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Repositories;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProfileController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ProfileService _profileService;
    private readonly ProgressionService _progressionService;

    public ProfileController(
        IUserRepository userRepository,
        ProfileService profileService,
        ProgressionService progressionService)
    {
        _userRepository = userRepository;
        _profileService = profileService;
        _progressionService = progressionService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var profile = await _profileService.GetMeAsync(userId.Value);
        if (profile is null)
            return NotFound();

        return Ok(profile);
    }

    [HttpGet("progression")]
    public async Task<IActionResult> GetProgression()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var progression = await _progressionService.GetForUserAsync(userId.Value);
        return Ok(progression);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            var updated = await _profileService.UpdateAsync(userId.Value, request);
            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            await _profileService.ChangePasswordAsync(userId.Value, request);
            return Ok(new { message = "Password changed." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var history = await _profileService.GetHistoryAsync(userId.Value, page, pageSize);
        return Ok(history);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var userId))
            return null;

        return userId;
    }
}