using System.Collections.Concurrent;

namespace Bts.Api.Services;

public sealed class InMemoryChatRateLimitService : IChatRateLimitService
{
    private readonly ConcurrentDictionary<string, DateTime> _lastSentUtc = new();

    public Task<bool> CanSendAsync(Guid roomId, Guid userId, int slowModeSeconds)
    {
        if (slowModeSeconds <= 0)
            return Task.FromResult(true);

        var key = $"{roomId:N}:{userId:N}";
        var now = DateTime.UtcNow;
        var cooldown = TimeSpan.FromSeconds(slowModeSeconds);

        if (_lastSentUtc.TryGetValue(key, out var lastSentUtc))
        {
            if (now - lastSentUtc < cooldown)
                return Task.FromResult(false);
        }

        _lastSentUtc[key] = now;
        return Task.FromResult(true);
    }
}
