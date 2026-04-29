using System.Collections.Concurrent;

namespace Bts.Api.Services;

public sealed class InMemoryOnlinePresenceTracker : IOnlinePresenceTracker
{
    private readonly ConcurrentDictionary<Guid, int> _onlineCounts = new();

    public Task MarkOnlineAsync(Guid userId)
    {
        _onlineCounts.AddOrUpdate(userId, 1, (_, count) => count + 1);
        return Task.CompletedTask;
    }

    public Task<int> MarkOfflineAsync(Guid userId)
    {
        var next = _onlineCounts.AddOrUpdate(userId, 0, (_, count) => Math.Max(0, count - 1));
        if (next <= 0)
        {
            _onlineCounts.TryRemove(userId, out _);
        }

        return Task.FromResult(next);
    }

    public Task<bool> IsOnlineAsync(Guid userId)
    {
        var isOnline = _onlineCounts.TryGetValue(userId, out var count) && count > 0;
        return Task.FromResult(isOnline);
    }

    public Task<IReadOnlyDictionary<Guid, bool>> GetOnlineStatusesAsync(IEnumerable<Guid> userIds)
    {
        var result = userIds
            .Distinct()
            .ToDictionary(
                userId => userId,
                userId => _onlineCounts.TryGetValue(userId, out var count) && count > 0);

        return Task.FromResult<IReadOnlyDictionary<Guid, bool>>(result);
    }
}
