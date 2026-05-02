using System.Collections.Concurrent;

namespace Bts.Api.Services;

public sealed class InMemoryRoomOccupancyTracker : IRoomOccupancyTracker
{
    private readonly ConcurrentDictionary<Guid, int> _roomOccupancy = new();
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<Guid, byte>> _connectionRooms = new();

    public Task MarkJoinedAsync(string connectionId, Guid roomId)
    {
        var rooms = _connectionRooms.GetOrAdd(connectionId, _ => new ConcurrentDictionary<Guid, byte>());
        if (rooms.TryAdd(roomId, 0))
        {
            _roomOccupancy.AddOrUpdate(roomId, 1, (_, count) => count + 1);
        }

        return Task.CompletedTask;
    }

    public Task MarkLeftAsync(string connectionId, Guid roomId)
    {
        if (_connectionRooms.TryGetValue(connectionId, out var rooms) && rooms.TryRemove(roomId, out _))
        {
            var next = _roomOccupancy.AddOrUpdate(roomId, 0, (_, count) => Math.Max(0, count - 1));
            if (next <= 0)
            {
                _roomOccupancy.TryRemove(roomId, out _);
            }

            if (rooms.IsEmpty)
            {
                _connectionRooms.TryRemove(connectionId, out _);
            }
        }

        return Task.CompletedTask;
    }

    public Task<int> GetOccupancyAsync(Guid roomId)
    {
        var count = _roomOccupancy.TryGetValue(roomId, out var value) ? value : 0;
        return Task.FromResult(count);
    }

    public Task<bool> HasOccupantsAsync(Guid roomId)
    {
        var hasOccupants = _roomOccupancy.TryGetValue(roomId, out var value) && value > 0;
        return Task.FromResult(hasOccupants);
    }

    public Task ClearConnectionAsync(string connectionId)
    {
        if (!_connectionRooms.TryRemove(connectionId, out var rooms))
        {
            return Task.CompletedTask;
        }

        foreach (var roomId in rooms.Keys)
        {
            var next = _roomOccupancy.AddOrUpdate(roomId, 0, (_, count) => Math.Max(0, count - 1));
            if (next <= 0)
            {
                _roomOccupancy.TryRemove(roomId, out _);
            }
        }

        return Task.CompletedTask;
    }
}
