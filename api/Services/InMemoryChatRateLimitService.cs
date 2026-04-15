using System.Collections.Concurrent;

namespace Bts.Api.Services;

public sealed class InMemoryChatRateLimitService : IChatRateLimitService
{
    private static readonly TimeSpan Cooldown = TimeSpan.FromSeconds(2);

    private readonly ConcurrentDictionary<string, DateTime> _lastSentUtc = new();

    public Task<bool> CanSendAsync(Guid roomId, Guid userId)
    {
        var key = $"{roomId:N}:{userId:N}";
        var now = DateTime.UtcNow;

        if (_lastSentUtc.TryGetValue(key, out var lastSentUtc))
        {
            if (now - lastSentUtc < Cooldown)
                return Task.FromResult(false);
        }

        _lastSentUtc[key] = now;
        return Task.FromResult(true);
    }
}