using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class RoomModerationStateService
{
    private readonly IRoomRepository _roomRepository;
    private readonly IRoomModerationRepository _roomModerationRepository;

    public RoomModerationStateService(
        IRoomRepository roomRepository,
        IRoomModerationRepository roomModerationRepository)
    {
        _roomRepository = roomRepository;
        _roomModerationRepository = roomModerationRepository;
    }

    public async Task<RoomModerationStateDto?> GetForUserAsync(Guid roomId, Guid userId)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            return null;

        var mute = await _roomModerationRepository.GetActiveMuteAsync(
            roomId,
            userId,
            DateTime.UtcNow);

        return new RoomModerationStateDto
        {
            IsMuted = mute is not null,
            MutedUntil = mute?.MutedUntil,
            SlowModeSeconds = room.SlowModeSeconds
        };
    }
}