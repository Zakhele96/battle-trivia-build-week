using Bts.Api.Auth;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Bts.Api.Services;

public sealed class RedisChatRateLimitService : IChatRateLimitService
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly RedisOptions _options;

    public RedisChatRateLimitService(
        IConnectionMultiplexer connectionMultiplexer,
        IOptions<RedisOptions> options)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _options = options.Value;
    }

    public Task<bool> CanSendAsync(Guid roomId, Guid userId, int slowModeSeconds)
    {
        if (slowModeSeconds <= 0)
            return Task.FromResult(true);

        var database = _connectionMultiplexer.GetDatabase();
        var key = $"{_options.KeyPrefix}:chat:cooldown:{roomId:N}:{userId:N}";
        return database.StringSetAsync(
            key,
            DateTime.UtcNow.ToString("O"),
            TimeSpan.FromSeconds(slowModeSeconds),
            when: When.NotExists);
    }
}
