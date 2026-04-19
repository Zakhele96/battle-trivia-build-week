using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IMentionNotificationRepository
{
    Task CreateAsync(
        Guid id,
        Guid mentionedUserId,
        Guid sourceUserId,
        Guid roomId,
        Guid chatMessageId,
        string previewText,
        string? sourceDisplayName,
        string? sourceUsername);

    Task<Dictionary<Guid, int>> GetUnreadCountsByRoomAsync(Guid userId);

    Task<IReadOnlyList<MentionNotificationItemResponse>> GetUnreadItemsAsync(
        Guid userId,
        int take);

    Task MarkRoomAsReadAsync(Guid roomId, Guid userId, DateTime readAtUtc);

    Task MarkMessageAsReadAsync(Guid chatMessageId, Guid userId, DateTime readAtUtc);
}