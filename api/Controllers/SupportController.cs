using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class SupportController : ControllerBase
{
    private readonly SupportService _supportService;

    public SupportController(SupportService supportService)
    {
        _supportService = supportService;
    }

    [Authorize]
    [HttpPost("payfast/subscribe")]
    public async Task<IActionResult> CreatePayFastSubscription([FromBody] CreateSupportSubscriptionRequest? request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        try
        {
            var result = await _supportService.CreatePayFastSupporterCheckoutAsync(userId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("payfast/notify")]
    public async Task<IActionResult> PayFastNotify()
    {
        var handled = await _supportService.HandlePayFastNotifyAsync(Request.Form);
        return handled ? Ok() : BadRequest();
    }
}
