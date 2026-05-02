namespace Bts.Api.Services;

public interface IRoomOccupancyTracker
{
    Task MarkJoinedAsync(string connectionId, Guid roomId);
    Task MarkLeftAsync(string connectionId, Guid roomId);
    Task<int> GetOccupancyAsync(Guid roomId);
    Task<bool> HasOccupantsAsync(Guid roomId);
    Task ClearConnectionAsync(string connectionId);
}
