using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class RoomService
{
    private readonly IRoomRepository _roomRepository;

    public RoomService(IRoomRepository roomRepository)
    {
        _roomRepository = roomRepository;
    }

    public async Task<IEnumerable<RoomResponse>> GetAllAsync()
    {
        var rooms = await _roomRepository.GetAllAsync();

        return rooms.Select(r => new RoomResponse
        {
            Id = r.Id,
            Name = r.Name,
            Slug = r.Slug,
            Description = r.Description,
            RoomType = r.RoomType,
            SlowModeSeconds = r.SlowModeSeconds
        });
    }

    public async Task<RoomResponse?> GetByIdAsync(Guid roomId)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null) return null;

        return new RoomResponse
        {
            Id = room.Id,
            Name = room.Name,
            Slug = room.Slug,
            Description = room.Description,
            RoomType = room.RoomType,
            SlowModeSeconds = room.SlowModeSeconds
        };
    }
}