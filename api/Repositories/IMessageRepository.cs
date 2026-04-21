using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IMessageRepository
{
    Task CreateAsync(
        Guid id,
        Guid roomId,
        Guid? userId,
        string messageText,
        string messageType,
        Guid? replyToMessageId = null);

    Task<IEnumerable<ChatMessageResponse>> GetRecentByRoomAsync(Guid roomId, Guid currentUserId, int take);
    Task<ChatMessageResponse?> GetPinnedByRoomAsync(Guid roomId, Guid currentUserId);
    Task<ChatMessageResponse?> GetByIdAsync(Guid messageId, Guid currentUserId);
    Task<Guid?> GetRoomIdByMessageIdAsync(Guid messageId);
    Task DeleteAsync(Guid messageId);

    Task<bool> MessageExistsInRoomAsync(Guid roomId, Guid messageId);
    Task<bool> UserOwnsMessageAsync(Guid messageId, Guid userId);
    Task UpdateTextAsync(Guid messageId, string messageText, DateTime editedAtUtc);

    Task ToggleReactionAsync(Guid messageId, Guid userId, string emoji);
    Task<List<ChatMessageReactionResponse>> GetReactionsAsync(Guid messageId, Guid currentUserId);

    Task PinMessageAsync(Guid roomId, Guid messageId, Guid pinnedByUserId, DateTime pinnedAtUtc);
    Task UnpinRoomAsync(Guid roomId);
    
    Task<IEnumerable<ChatMessageResponse>> GetContextByMessageIdAsync(
    Guid roomId,
    Guid messageId,
    Guid currentUserId,
    int before,
    int after);

    Task<IEnumerable<ChatMessageResponse>> GetOlderByRoomAsync(
    Guid roomId,
    Guid beforeMessageId,
    Guid currentUserId,
    int take);
}
