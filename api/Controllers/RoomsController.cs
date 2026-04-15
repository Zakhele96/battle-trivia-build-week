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
        WordScrambleSessionStatusService wordScrambleSessionStatusService,
        WordScrambleStateService wordScrambleStateService)
    {
        _roomService = roomService;
        _chatService = chatService;
        _battleTriviaSessionStatusService = battleTriviaSessionStatusService;
        _wordScrambleSessionStatusService = wordScrambleSessionStatusService;
        _wordScrambleStateService = wordScrambleStateService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms()
    {
        var rooms = await _roomService.GetAllAsync();
        return Ok(rooms);
    }

    [HttpGet("{roomId:guid}")]
    public async Task<IActionResult> GetRoom(Guid roomId)
    {
        var room = await _roomService.GetByIdAsync(roomId);
        if (room is null) return NotFound();

        return Ok(room);
    }

    [HttpGet("{roomId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid roomId, [FromQuery] int take = 50)
    {
        take = Math.Clamp(take, 1, 100);

        try
        {
            var messages = await _chatService.GetRecentMessagesAsync(roomId, take);
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


}