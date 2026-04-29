using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IDirectMessageRepository
{
    Task<DirectConversation?> GetConversationByIdAsync(Guid conversationId);
    Task<DirectConversation?> GetConversationForUsersAsync(Guid userId, Guid otherUserId);
    Task<DirectConversation> GetOrCreateConversationAsync(Guid userId, Guid otherUserId);
    Task<IReadOnlyList<DirectConversationResponse>> GetConversationsAsync(Guid userId);
    Task<IReadOnlyList<DirectMessageResponse>> GetMessagesAsync(Guid conversationId, Guid currentUserId, int take = 50);
    Task<DirectMessageResponse?> GetMessageByIdAsync(Guid messageId, Guid currentUserId);
    Task<bool> IsParticipantAsync(Guid conversationId, Guid userId);
    Task CreateMessageAsync(DirectMessage message);
    Task<int> MarkConversationReadAsync(Guid conversationId, Guid userId, DateTime readAtUtc);
    Task ToggleReactionAsync(Guid messageId, Guid userId, string emoji);
    Task<List<ChatMessageReactionResponse>> GetReactionsAsync(Guid messageId, Guid currentUserId);
}
