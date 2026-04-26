using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/direct-messages")]
public sealed class DirectMessagesController : ControllerBase
{
    private readonly DirectMessageService _directMessageService;

    public DirectMessagesController(DirectMessageService directMessageService)
    {
        _directMessageService = directMessageService;
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
            await _directMessageService.MarkReadAsync(userId.Value, conversationId);
            return Ok(new { message = "Conversation read." });
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
            var message = await _directMessageService.SendMessageAsync(userId.Value, request.RecipientUserId, request.MessageText);
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
