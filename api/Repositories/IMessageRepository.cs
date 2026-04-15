using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IMessageRepository
{
    Task CreateAsync(Guid id, Guid roomId, Guid? userId, string messageText, string messageType);
    Task<IEnumerable<ChatMessageResponse>> GetRecentByRoomAsync(Guid roomId, int take);
    Task DeleteAsync(Guid messageId);
    Task<Guid?> GetRoomIdByMessageIdAsync(Guid messageId);
}