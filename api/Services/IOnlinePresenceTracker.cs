namespace Bts.Api.Services;

public interface IOnlinePresenceTracker
{
    Task MarkOnlineAsync(Guid userId);
    Task<int> MarkOfflineAsync(Guid userId);
    Task<bool> IsOnlineAsync(Guid userId);
    Task<IReadOnlyDictionary<Guid, bool>> GetOnlineStatusesAsync(IEnumerable<Guid> userIds);
}
