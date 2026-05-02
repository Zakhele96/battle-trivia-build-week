using Bts.Api.Auth;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Bts.Api.Services;

public sealed class RedisRoomOccupancyTracker : IRoomOccupancyTracker
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly RedisOptions _options;

    public RedisRoomOccupancyTracker(
        IConnectionMultiplexer connectionMultiplexer,
        IOptions<RedisOptions> options)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _options = options.Value;
    }

    public async Task MarkJoinedAsync(string connectionId, Guid roomId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var connectionKey = GetConnectionRoomsKey(connectionId);
        var roomKey = GetRoomOccupancyKey(roomId);

        if (await database.SetAddAsync(connectionKey, roomId.ToString("N")))
        {
            await database.StringIncrementAsync(roomKey);
        }
    }

    public async Task MarkLeftAsync(string connectionId, Guid roomId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var connectionKey = GetConnectionRoomsKey(connectionId);
        var roomKey = GetRoomOccupancyKey(roomId);

        if (!await database.SetRemoveAsync(connectionKey, roomId.ToString("N")))
        {
            return;
        }

        var next = await database.StringDecrementAsync(roomKey);
        if (next <= 0)
        {
            await database.KeyDeleteAsync(roomKey);
        }

        if (await database.SetLengthAsync(connectionKey) <= 0)
        {
            await database.KeyDeleteAsync(connectionKey);
        }
    }

    public async Task<int> GetOccupancyAsync(Guid roomId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var value = await database.StringGetAsync(GetRoomOccupancyKey(roomId));
        return value.HasValue && value.TryParse(out int count) && count > 0 ? count : 0;
    }

    public async Task<bool> HasOccupantsAsync(Guid roomId)
    {
        return await GetOccupancyAsync(roomId) > 0;
    }

    public async Task ClearConnectionAsync(string connectionId)
    {
        var database = _connectionMultiplexer.GetDatabase();
        var connectionKey = GetConnectionRoomsKey(connectionId);
        var roomIds = await database.SetMembersAsync(connectionKey);

        foreach (var roomIdValue in roomIds)
        {
            if (!Guid.TryParse(roomIdValue.ToString(), out var roomId))
            {
                continue;
            }

            var roomKey = GetRoomOccupancyKey(roomId);
            var next = await database.StringDecrementAsync(roomKey);
            if (next <= 0)
            {
                await database.KeyDeleteAsync(roomKey);
            }
        }

        await database.KeyDeleteAsync(connectionKey);
    }

    private string GetRoomOccupancyKey(Guid roomId) => $"{_options.KeyPrefix}:rooms:occupancy:{roomId:N}";
    private string GetConnectionRoomsKey(string connectionId) => $"{_options.KeyPrefix}:rooms:conn:{connectionId}";
}
