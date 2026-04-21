using System.Security.Claims;
using Bts.Api.Models.Dtos;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class RoomsController : ControllerBase
{
    private readonly RoomService _roomService;
    private readonly ChatService _chatService;
    private readonly BattleTriviaSessionStatusService _battleTriviaSessionStatusService;
    private readonly RoomModerationStateService _roomModerationStateService;
    private readonly WordScrambleSessionStatusService _wordScrambleSessionStatusService;
    private readonly WordScrambleStateService _wordScrambleStateService;

    public RoomsController(
        RoomService roomService,
        ChatService chatService,
        BattleTriviaSessionStatusService battleTriviaSessionStatusService,
        RoomModerationStateService roomModerationStateService,
        WordScrambleSessionStatusService wordScrambleSessionStatusService,
        WordScrambleStateService wordScrambleStateService)
    {
        _roomService = roomService;
        _chatService = chatService;
        _battleTriviaSessionStatusService = battleTriviaSessionStatusService;
        _roomModerationStateService = roomModerationStateService;
        _wordScrambleSessionStatusService = wordScrambleSessionStatusService;
        _wordScrambleStateService = wordScrambleStateService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms()
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var rooms = await _roomService.GetAllAsync(userId);
        return Ok(rooms);
    }

    [HttpGet("mentions/unread")]
    public async Task<IActionResult> GetUnreadMentions([FromQuery] int take = 20)
    {
        take = Math.Clamp(take, 1, 50);

        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var mentions = await _roomService.GetUnreadMentionsAsync(userId, take);
        return Ok(mentions);
    }

    [HttpPost("messages/{messageId:guid}/mention-read")]
    public async Task<IActionResult> MarkMessageMentionRead(Guid messageId)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        await _roomService.MarkMessageMentionReadAsync(messageId, userId);

        return Ok(new
        {
            messageId
        });
    }

    [HttpGet("{roomId:guid}")]
    public async Task<IActionResult> GetRoom(Guid roomId)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var room = await _roomService.GetByIdAsync(roomId, userId);
        if (room is null) return NotFound();

        return Ok(room);
    }

    [HttpPost("{roomId:guid}/mentions/read")]
    public async Task<IActionResult> MarkMentionsRead(Guid roomId)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        await _roomService.MarkRoomMentionsReadAsync(roomId, userId);

        return Ok(new
        {
            roomId,
            unreadMentionCount = 0
        });
    }

    [HttpGet("{roomId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid roomId, [FromQuery] int take = 50)
    {
        take = Math.Clamp(take, 1, 100);

        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        try
        {
            var messages = await _chatService.GetRecentMessagesAsync(roomId, userId, take);
            return Ok(messages);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{roomId:guid}/pinned-message")]
    public async Task<IActionResult> GetPinnedMessage(Guid roomId)
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        try
        {
            var message = await _chatService.GetPinnedMessageAsync(roomId, userId);
            return Ok(message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{roomId:guid}/messages/{messageId:guid}/context")]
    public async Task<IActionResult> GetMessageContext(
        Guid roomId,
        Guid messageId,
        [FromQuery] int before = 25,
        [FromQuery] int after = 25)
    {
        before = Math.Clamp(before, 1, 100);
        after = Math.Clamp(after, 1, 100);

        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        try
        {
            var messages = await _chatService.GetMessageContextAsync(
                roomId,
                messageId,
                userId,
                before,
                after);

            return Ok(messages);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{roomId:guid}/session-status")]
    public async Task<ActionResult<BattleTriviaSessionStatusDto>> GetSessionStatus(Guid roomId)
    {
        var status = await _battleTriviaSessionStatusService.GetRoomStatusAsync(roomId);
        return Ok(status);
    }

    [HttpGet("{roomId:guid}/moderation-state/me")]
    public async Task<ActionResult<RoomModerationStateDto>> GetModerationState(Guid roomId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var state = await _roomModerationStateService.GetForUserAsync(roomId, userId);
        if (state is null)
            return NotFound();

        return Ok(state);
    }

    [HttpGet("{roomId:guid}/word-scramble-status")]
    public async Task<ActionResult<WordScrambleSessionStatusDto>> GetWordScrambleStatus(Guid roomId)
    {
        var status = await _wordScrambleSessionStatusService.GetRoomStatusAsync(roomId);
        return Ok(status);
    }

    [HttpGet("{roomId:guid}/word-scramble-state")]
    public async Task<ActionResult<WordScrambleStateDto>> GetWordScrambleState(Guid roomId)
    {
        var state = await _wordScrambleStateService.GetRoomStateAsync(roomId);
        return Ok(state);
    }

    [HttpGet("{roomId:guid}/messages/older")]
    public async Task<IActionResult> GetOlderMessages(
        Guid roomId,
        [FromQuery] Guid beforeMessageId,
        [FromQuery] int take = 50)
        {
            take = Math.Clamp(take, 1, 100);

            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("sub");

            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            try
            {
                var messages = await _chatService.GetOlderMessagesAsync(
                    roomId,
                    beforeMessageId,
                    userId,
                    take);

                return Ok(messages);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

}
