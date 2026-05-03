using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/push-notifications")]
public sealed class PushNotificationsController : ControllerBase
{
    private readonly WebPushService _webPushService;
    private readonly ILogger<PushNotificationsController> _logger;

    public PushNotificationsController(
        WebPushService webPushService,
        ILogger<PushNotificationsController> logger)
    {
        _webPushService = webPushService;
        _logger = logger;
    }

    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        return Ok(new
        {
            isConfigured = _webPushService.IsConfigured,
            publicKey = _webPushService.IsConfigured ? _webPushService.PublicKey : string.Empty
        });
    }

    [HttpPost("subscriptions")]
    public async Task<IActionResult> SaveSubscription([FromBody] SavePushSubscriptionRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            _logger.LogInformation(
                "Received push subscription save request for user {UserId}.",
                userId.Value);
            await _webPushService.SaveSubscriptionAsync(
                userId.Value,
                request,
                Request.Headers.UserAgent.ToString());
            return Ok(new { message = "Push subscription saved." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("subscriptions/delete")]
    public async Task<IActionResult> DeleteSubscription([FromBody] DeletePushSubscriptionRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        await _webPushService.DeleteSubscriptionAsync(userId.Value, request.Endpoint);
        _logger.LogInformation(
            "Received push subscription delete request for user {UserId}.",
            userId.Value);
        return Ok(new { message = "Push subscription removed." });
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
