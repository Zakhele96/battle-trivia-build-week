using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IDirectMessageRepository
{
    Task<DirectConversation?> GetConversationByIdAsync(Guid conversationId);
    Task<DirectConversation?> GetConversationForUsersAsync(Guid userId, Guid otherUserId);
    Task<DirectConversation> GetOrCreateConversationAsync(Guid userId, Guid otherUserId);
    Task<IReadOnlyList<DirectConversationResponse>> GetConversationsAsync(Guid userId);
    Task<IReadOnlyList<DirectMessageResponse>> GetMessagesAsync(Guid conversationId, int take = 50);
    Task<bool> IsParticipantAsync(Guid conversationId, Guid userId);
    Task CreateMessageAsync(DirectMessage message);
    Task MarkConversationReadAsync(Guid conversationId, Guid userId, DateTime readAtUtc);
}
