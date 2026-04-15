using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface IRoomModerationRepository
{
    Task<RoomUserMute?> GetActiveMuteAsync(Guid roomId, Guid userId, DateTime nowUtc);
    Task UpsertMuteAsync(RoomUserMute mute);
    Task ClearMuteAsync(Guid roomId, Guid userId);
    Task AddActionAsync(RoomModerationAction action);

    Task<IReadOnlyList<RoomModerationActionDto>> GetRecentActionsAsync(Guid roomId, int take = 20);
}