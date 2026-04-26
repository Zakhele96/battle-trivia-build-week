using System.Collections.Concurrent;
using Bts.Api.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace Bts.Api.Services;

public sealed class UserPresenceService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ConcurrentDictionary<Guid, int> _onlineCounts = new();

    public UserPresenceService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public void MarkOnline(Guid userId)
    {
        _onlineCounts.AddOrUpdate(userId, 1, (_, count) => count + 1);
    }

    public async Task<DateTime> MarkOfflineAsync(Guid userId)
    {
        var next = _onlineCounts.AddOrUpdate(userId, 0, (_, count) => Math.Max(0, count - 1));
        if (next > 0)
        {
            return await GetLastSeenAtAsync(userId) ?? DateTime.UtcNow;
        }

        _onlineCounts.TryRemove(userId, out _);
        var lastSeenAt = DateTime.UtcNow;
        await UpsertLastSeenAsync(userId, lastSeenAt);
        return lastSeenAt;
    }

    public bool IsOnline(Guid userId)
    {
        return _onlineCounts.TryGetValue(userId, out var count) && count > 0;
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
