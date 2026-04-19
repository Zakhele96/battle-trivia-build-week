using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class RoomService
{
    private readonly IRoomRepository _roomRepository;
    private readonly MentionNotificationService _mentionNotificationService;

    public RoomService(
        IRoomRepository roomRepository,
        MentionNotificationService mentionNotificationService)
    {
        _roomRepository = roomRepository;
        _mentionNotificationService = mentionNotificationService;
    }

    public async Task<IEnumerable<RoomResponse>> GetAllAsync(Guid currentUserId)
    {
        var rooms = (await _roomRepository.GetAllAsync()).ToList();
        var unreadCounts = await _mentionNotificationService.GetUnreadCountsByRoomAsync(currentUserId);

        return rooms.Select(r => new RoomResponse
        {
            Id = r.Id,
            Name = r.Name,
            Slug = r.Slug,
            Description = r.Description,
            RoomType = r.RoomType,
            SlowModeSeconds = r.SlowModeSeconds,
            UnreadMentionCount = unreadCounts.TryGetValue(r.Id, out var count) ? count : 0
        });
    }

    public async Task<RoomResponse?> GetByIdAsync(Guid roomId, Guid currentUserId)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null) return null;

        var unreadCounts = await _mentionNotificationService.GetUnreadCountsByRoomAsync(currentUserId);

        return new RoomResponse
        {
            Id = room.Id,
            Name = room.Name,
            Slug = room.Slug,
            Description = room.Description,
            RoomType = room.RoomType,
            SlowModeSeconds = room.SlowModeSeconds,
            UnreadMentionCount = unreadCounts.TryGetValue(room.Id, out var count) ? count : 0
        };
    }

    public Task<IReadOnlyList<MentionNotificationItemResponse>> GetUnreadMentionsAsync(
        Guid userId,
        int take)
    {
        return _mentionNotificationService.GetUnreadItemsAsync(userId, take);
    }

    public Task MarkRoomMentionsReadAsync(Guid roomId, Guid userId)
    {
        return _mentionNotificationService.MarkRoomMentionsReadAsync(roomId, userId);
    }

    public Task MarkMessageMentionReadAsync(Guid messageId, Guid userId)
    {
        return _mentionNotificationService.MarkMessageMentionReadAsync(messageId, userId);
    }
}