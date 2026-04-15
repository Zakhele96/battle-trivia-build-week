using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class RoomModerationService
{
    private readonly IRoomModerationRepository _roomModerationRepository;
    private readonly IRoomRepository _roomRepository;

    public RoomModerationService(
        IRoomModerationRepository roomModerationRepository,
        IRoomRepository roomRepository)
    {
        _roomModerationRepository = roomModerationRepository;
        _roomRepository = roomRepository;
    }

    public async Task MuteAsync(Guid roomId, Guid adminUserId, MuteRoomUserRequest request)
    {
        DateTime? mutedUntil = request.DurationMinutes.HasValue
            ? DateTime.UtcNow.AddMinutes(request.DurationMinutes.Value)
            : null;

        var mute = new RoomUserMute
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = request.UserId,
            Reason = request.Reason?.Trim(),
            MutedUntil = mutedUntil,
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _roomModerationRepository.UpsertMuteAsync(mute);

        await _roomModerationRepository.AddActionAsync(new RoomModerationAction
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            TargetUserId = request.UserId,
            ActionType = "mute",
            Reason = request.Reason?.Trim(),
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = mutedUntil
        });
    }

    public async Task UnmuteAsync(Guid roomId, Guid adminUserId, Guid userId)
    {
        await _roomModerationRepository.ClearMuteAsync(roomId, userId);

        await _roomModerationRepository.AddActionAsync(new RoomModerationAction
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            TargetUserId = userId,
            ActionType = "unmute",
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task UpdateSlowModeAsync(Guid roomId, Guid adminUserId, int slowModeSeconds)
    {
        slowModeSeconds = Math.Clamp(slowModeSeconds, 0, 120);

        await _roomRepository.UpdateSlowModeAsync(roomId, slowModeSeconds);

        await _roomModerationRepository.AddActionAsync(new RoomModerationAction
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            ActionType = "slow_mode",
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow,
            MetadataJson = $$"""{"slowModeSeconds":{{slowModeSeconds}}}"""
        });
    }
}