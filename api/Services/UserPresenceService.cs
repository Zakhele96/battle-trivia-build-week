using Bts.Api.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace Bts.Api.Services;

public sealed class UserPresenceService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOnlinePresenceTracker _onlinePresenceTracker;

    public UserPresenceService(
        IServiceScopeFactory scopeFactory,
        IOnlinePresenceTracker onlinePresenceTracker)
    {
        _scopeFactory = scopeFactory;
        _onlinePresenceTracker = onlinePresenceTracker;
    }

    public Task MarkOnlineAsync(Guid userId)
    {
        return _onlinePresenceTracker.MarkOnlineAsync(userId);
    }

    public async Task<DateTime> MarkOfflineAsync(Guid userId)
    {
        var next = await _onlinePresenceTracker.MarkOfflineAsync(userId);
        if (next > 0)
        {
            return await GetLastSeenAtAsync(userId) ?? DateTime.UtcNow;
        }

        var lastSeenAt = DateTime.UtcNow;
        await UpsertLastSeenAsync(userId, lastSeenAt);
        return lastSeenAt;
    }

    public Task<bool> IsOnlineAsync(Guid userId)
    {
        return _onlinePresenceTracker.IsOnlineAsync(userId);
    }

    public Task<IReadOnlyDictionary<Guid, bool>> GetOnlineStatusesAsync(IEnumerable<Guid> userIds)
    {
        return _onlinePresenceTracker.GetOnlineStatusesAsync(userIds);
    }

    public async Task<IReadOnlyDictionary<Guid, DateTime?>> GetLastSeenManyAsync(IEnumerable<Guid> userIds)
    {
        using var scope = _scopeFactory.CreateScope();
        var presenceRepository = scope.ServiceProvider.GetRequiredService<IUserPresenceRepository>();
        return await presenceRepository.GetLastSeenAtManyAsync(userIds);
    }

    private async Task<DateTime?> GetLastSeenAtAsync(Guid userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var presenceRepository = scope.ServiceProvider.GetRequiredService<IUserPresenceRepository>();
        return await presenceRepository.GetLastSeenAtAsync(userId);
    }

    private async Task UpsertLastSeenAsync(Guid userId, DateTime lastSeenAtUtc)
    {
        using var scope = _scopeFactory.CreateScope();
        var presenceRepository = scope.ServiceProvider.GetRequiredService<IUserPresenceRepository>();
        await presenceRepository.UpsertLastSeenAsync(userId, lastSeenAtUtc);
    }
}
