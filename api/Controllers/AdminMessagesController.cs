using System.Security.Claims;
using Bts.Api.Hubs;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Controllers;

[ApiController]
[Route("api/admin/messages")]
[Authorize]
public sealed class AdminMessagesController : ControllerBase
{
    private readonly MessageModerationService _messageModerationService;
    private readonly ChatService _chatService;
    private readonly IHubContext<ChatHub> _hubContext;

    public AdminMessagesController(
        MessageModerationService messageModerationService,
        ChatService chatService,
        IHubContext<ChatHub> hubContext)
    {
        _messageModerationService = messageModerationService;
        _chatService = chatService;
        _hubContext = hubContext;
    }

    [HttpDelete("{messageId:guid}")]
    public async Task<IActionResult> Delete(Guid messageId, [FromQuery] string? reason = null)
    {
        if (!IsAdmin())
            return Forbid();

        var adminUserId = GetRequiredUserId();
        var roomId = await _messageModerationService.DeleteMessageAsync(messageId, adminUserId, reason);

        if (!roomId.HasValue)
            return NotFound();

        await _hubContext.Clients.Group(roomId.Value.ToString())
            .SendAsync("MessageDeleted", new
            {
                messageId
            });

        var systemMessage = await _chatService.CreateSystemMessageAsync(
            roomId.Value,
            "A moderator removed a message.");

        await _hubContext.Clients.Group(roomId.Value.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        return Ok();
    }

    private bool IsAdmin()
    {
        var value = User.FindFirstValue("isAdmin");
        return string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
    }

    private Guid GetRequiredUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId))
            throw new UnauthorizedAccessException("Unauthorized.");

        return userId;
    }
}