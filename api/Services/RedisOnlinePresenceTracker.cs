using Bts.Api.Auth;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Bts.Api.Services;

public sealed class RedisOnlinePresenceTracker : IOnlinePresenceTracker
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly RedisOptions _options;

    public RedisOnlinePresenceTracker(
        IConnectionMultiplexer connectionMultiplexer,
        IOptions<RedisOptions> options)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _options = options.Value;
    }

    public async Task MarkOnlineAsync(Guid userId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var key = GetPresenceKey(userId);
        var next = await database.StringIncrementAsync(key);
        if (next > 0)
        {
            await database.KeyExpireAsync(
                key,
                TimeSpan.FromMinutes(Math.Max(1, _options.PresenceKeyExpiryMinutes)));
        }
    }

    public async Task<int> MarkOfflineAsync(Guid userId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var key = GetPresenceKey(userId);
        var next = await database.StringDecrementAsync(key);
        if (next <= 0)
        {
            await database.KeyDeleteAsync(key);
            return 0;
        }

        await database.KeyExpireAsync(
            key,
            TimeSpan.FromMinutes(Math.Max(1, _options.PresenceKeyExpiryMinutes)));
        return (int)Math.Min(next, int.MaxValue);
    }

    public async Task<bool> IsOnlineAsync(Guid userId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var value = await database.StringGetAsync(GetPresenceKey(userId));
        return value.HasValue && value.TryParse(out int count) && count > 0;
    }

    public async Task<IReadOnlyDictionary<Guid, bool>> GetOnlineStatusesAsync(IEnumerable<Guid> userIds)
    {
        var ids = userIds.Distinct().ToArray();
        if (ids.Length == 0)
            return new Dictionary<Guid, bool>();

        var database = _connectionMultiplexer.GetDatabase();
        var keys = ids
            .Select(GetPresenceKey)
            .Select(key => (RedisKey)key)
            .ToArray();
        var values = await database.StringGetAsync(keys);

        var result = new Dictionary<Guid, bool>(ids.Length);
        for (var i = 0; i < ids.Length; i++)
        {
            result[ids[i]] = values[i].HasValue && values[i].TryParse(out int count) && count > 0;
        }

        return result;
    }

    private string GetPresenceKey(Guid userId) => $"{_options.KeyPrefix}:presence:online:{userId:N}";
}
