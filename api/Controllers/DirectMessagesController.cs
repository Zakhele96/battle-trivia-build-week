using System.Security.Claims;
using Bts.Api.Hubs;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/direct-messages")]
public sealed class DirectMessagesController : ControllerBase
{
    private readonly DirectMessageService _directMessageService;
    private readonly IHubContext<ChatHub> _chatHubContext;
    private readonly WebPushService _webPushService;

    public DirectMessagesController(
        DirectMessageService directMessageService,
        IHubContext<ChatHub> chatHubContext,
        WebPushService webPushService)
    {
        _directMessageService = directMessageService;
        _chatHubContext = chatHubContext;
        _webPushService = webPushService;
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var conversations = await _directMessageService.GetConversationsAsync(userId.Value);
        return Ok(conversations);
    }

    [HttpPost("conversations/with/{otherUserId:guid}")]
    public async Task<IActionResult> GetOrCreateConversation(Guid otherUserId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            var conversation = await _directMessageService.GetOrCreateConversationAsync(userId.Value, otherUserId);
            return Ok(conversation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] int take = 50)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            var messages = await _directMessageService.GetMessagesAsync(userId.Value, conversationId, take);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("conversations/{conversationId:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid conversationId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            var receipt = await _directMessageService.MarkReadAsync(userId.Value, conversationId);

            if (receipt is not null)
            {
                await _chatHubContext.Clients.Group($"dm:{conversationId}")
                    .SendAsync("DirectMessageRead", receipt);
            }

            if (receipt is not null)
            {
                return Ok(receipt);
            }

            return Ok(new { message = "Conversation already read." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendDirectMessageRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            var message = await _directMessageService.SendMessageAsync(userId.Value, request.RecipientUserId, request.MessageText, request.ReplyToMessageId);
            await _chatHubContext.Clients.Users(userId.Value.ToString(), request.RecipientUserId.ToString())
                .SendAsync("DirectMessageReceived", message);
            await _webPushService.SendDirectMessageNotificationAsync(message);
            return Ok(message);
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

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var userId))
            return null;

        return userId;
    }
}
