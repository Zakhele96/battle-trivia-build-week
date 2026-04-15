using System.Security.Claims;
using Bts.Api.Hubs;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Controllers;

[ApiController]
[Route("api/admin/rooms")]
[Authorize]
public sealed class AdminRoomModerationController : ControllerBase
{
    private readonly RoomModerationService _roomModerationService;
    private readonly IRoomModerationRepository _roomModerationRepository;
    private readonly IUserRepository _userRepository;
    private readonly ChatService _chatService;
    private readonly IHubContext<ChatHub> _hubContext;

    public AdminRoomModerationController(
        RoomModerationService roomModerationService,
        IRoomModerationRepository roomModerationRepository,
        IUserRepository userRepository,
        ChatService chatService,
        IHubContext<ChatHub> hubContext)
    {
        _roomModerationService = roomModerationService;
        _roomModerationRepository = roomModerationRepository;
        _userRepository = userRepository;
        _chatService = chatService;
        _hubContext = hubContext;
    }

    [HttpPost("{roomId:guid}/mute")]
    public async Task<IActionResult> Mute(Guid roomId, [FromBody] MuteRoomUserRequest request)
    {
        if (!IsAdmin())
            return Forbid();

        var adminUserId = GetRequiredUserId();

        await _roomModerationService.MuteAsync(roomId, adminUserId, request);

        var targetUser = await _userRepository.GetByIdAsync(request.UserId);
        var targetName = targetUser?.DisplayName ?? targetUser?.Username ?? "A user";

        var systemText = request.DurationMinutes.HasValue
            ? $"{targetName} was muted by a moderator for {request.DurationMinutes.Value} minute{(request.DurationMinutes.Value == 1 ? "" : "s")}."
            : $"{targetName} was muted by a moderator.";

        var systemMessage = await _chatService.CreateSystemMessageAsync(roomId, systemText);

        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        return Ok();
    }

    [HttpPost("{roomId:guid}/unmute")]
    public async Task<IActionResult> Unmute(Guid roomId, [FromBody] UnmuteRoomUserRequest request)
    {
        if (!IsAdmin())
            return Forbid();

        var adminUserId = GetRequiredUserId();

        await _roomModerationService.UnmuteAsync(roomId, adminUserId, request.UserId);

        var targetUser = await _userRepository.GetByIdAsync(request.UserId);
        var targetName = targetUser?.DisplayName ?? targetUser?.Username ?? "A user";

        var systemMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{targetName} was unmuted by a moderator.");

        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        return Ok();
    }

    [HttpPost("{roomId:guid}/slow-mode")]
    public async Task<IActionResult> UpdateSlowMode(Guid roomId, [FromBody] UpdateRoomSlowModeRequest request)
    {
        if (!IsAdmin())
            return Forbid();

        var adminUserId = GetRequiredUserId();

        await _roomModerationService.UpdateSlowModeAsync(
            roomId,
            adminUserId,
            request.SlowModeSeconds);

        var systemText = request.SlowModeSeconds > 0
            ? $"Slow mode is now {request.SlowModeSeconds} seconds."
            : "Slow mode was turned off.";

        var systemMessage = await _chatService.CreateSystemMessageAsync(roomId, systemText);

        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        return Ok();
    }

    [HttpGet("{roomId:guid}/actions")]
    public async Task<IActionResult> GetRecentActions(Guid roomId, [FromQuery] int take = 20)
    {
        if (!IsAdmin())
            return Forbid();

        take = Math.Clamp(take, 1, 50);

        var actions = await _roomModerationRepository.GetRecentActionsAsync(roomId, take);
        return Ok(actions);
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