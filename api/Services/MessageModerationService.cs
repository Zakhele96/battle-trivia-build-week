using Bts.Api.Models.Domain;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class MessageModerationService
{
    private readonly IMessageRepository _messageRepository;
    private readonly IRoomModerationRepository _roomModerationRepository;

    public MessageModerationService(
        IMessageRepository messageRepository,
        IRoomModerationRepository roomModerationRepository)
    {
        _messageRepository = messageRepository;
        _roomModerationRepository = roomModerationRepository;
    }

    public async Task<Guid?> DeleteMessageAsync(Guid messageId, Guid adminUserId, string? reason = null)
    {
        var roomId = await _messageRepository.GetRoomIdByMessageIdAsync(messageId);
        if (!roomId.HasValue)
            return null;

        await _messageRepository.DeleteAsync(messageId);

        await _roomModerationRepository.AddActionAsync(new RoomModerationAction
        {
            Id = Guid.NewGuid(),
            RoomId = roomId.Value,
            ActionType = "delete_message",
            Reason = reason?.Trim(),
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow,
            MetadataJson = $$"""{"messageId":"{{messageId}}"}"""
        });

        return roomId.Value;
    }
}