using Bts.Api.Auth;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Bts.Api.Services;

public sealed class RedisJobCoordinator : IDistributedJobCoordinator
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly RedisOptions _options;
    private readonly string _instanceId = $"{Environment.MachineName}:{Guid.NewGuid():N}";

    public RedisJobCoordinator(
        IConnectionMultiplexer connectionMultiplexer,
        IOptions<RedisOptions> options)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _options = options.Value;
    }

    public async Task RunIfLeaderAsync(
        string jobName,
        Func<CancellationToken, Task> work,
        CancellationToken cancellationToken)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var lockKey = $"{_options.KeyPrefix}:jobs:leader:{jobName}";
        var lockExpiry = TimeSpan.FromSeconds(Math.Max(5, _options.HostedServiceLockSeconds));

        var acquired = await database.StringSetAsync(
            lockKey,
            _instanceId,
            lockExpiry,
            when: When.NotExists);

        if (!acquired)
        {
            var currentOwner = await database.StringGetAsync(lockKey);
            if (currentOwner.HasValue && currentOwner == _instanceId)
            {
                acquired = await database.StringSetAsync(
                    lockKey,
                    _instanceId,
                    lockExpiry,
                    when: When.Always);
            }
        }

        if (!acquired)
            return;

        using var renewalCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        var renewalTask = RenewLeaseAsync(database, lockKey, lockExpiry, renewalCts.Token);

        try
        {
            await work(cancellationToken);
        }
        finally
        {
            renewalCts.Cancel();
            try
            {
                await renewalTask;
            }
            catch (OperationCanceledException)
            {
            }

            const string releaseScript = """
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                end
                return 0
                """;

            await database.ScriptEvaluateAsync(
                releaseScript,
                [lockKey],
                [_instanceId]);
        }
    }

    private async Task RenewLeaseAsync(
        IDatabase database,
        string lockKey,
        TimeSpan lockExpiry,
        CancellationToken cancellationToken)
    {
        var renewEvery = TimeSpan.FromMilliseconds(Math.Max(1000, lockExpiry.TotalMilliseconds / 2));

        while (!cancellationToken.IsCancellationRequested)
        {
            await Task.Delay(renewEvery, cancellationToken);

            const string renewScript = """
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('expire', KEYS[1], ARGV[2])
                end
                return 0
                """;

            await database.ScriptEvaluateAsync(
                renewScript,
                [lockKey],
                [_instanceId, (long)Math.Ceiling(lockExpiry.TotalSeconds)]);
        }
    }
}
