using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/users")]
public sealed class AdminUsersController : ControllerBase
{
    private readonly AdminUserService _adminUserService;

    public AdminUsersController(AdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? query, [FromQuery] int take = 50)
    {
        if (!IsAdmin()) return Forbid();

        var users = await _adminUserService.SearchAsync(query, take);
        return Ok(users);
    }

    [HttpPatch("{userId:guid}/admin")]
    public async Task<IActionResult> SetAdmin(Guid userId, [FromBody] UpdateUserAdminRequest request)
    {
        if (!IsAdmin()) return Forbid();

        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentAdminUserId) &&
            !Guid.TryParse(User.FindFirstValue("sub"), out currentAdminUserId))
        {
            return Unauthorized();
        }

        try
        {
            var user = await _adminUserService.SetAdminAsync(
                currentAdminUserId,
                userId,
                request.IsAdmin);

            if (user is null) return NotFound();

            return Ok(user);
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
