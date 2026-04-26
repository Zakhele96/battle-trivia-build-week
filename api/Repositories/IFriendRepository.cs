using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IFriendRepository
{
    Task<Friendship?> GetRelationshipAsync(Guid userId, Guid otherUserId);
    Task CreateRequestAsync(Friendship friendship);
    Task<bool> AcceptAsync(Guid friendshipId, Guid userId);
    Task<bool> DeclineAsync(Guid friendshipId, Guid userId);
    Task<IReadOnlyList<Guid>> GetAcceptedFriendIdsAsync(Guid userId);
    Task<IReadOnlyList<FriendUserResponse>> GetFriendsAsync(Guid userId);
    Task<IReadOnlyList<FriendUserResponse>> GetIncomingRequestsAsync(Guid userId);
    Task<IReadOnlyList<FriendUserResponse>> GetOutgoingRequestsAsync(Guid userId);
    Task<HeadToHeadGameRecordDto> GetTriviaHeadToHeadAsync(Guid userId, Guid otherUserId);
    Task<HeadToHeadGameRecordDto> GetWordScrambleHeadToHeadAsync(Guid userId, Guid otherUserId);
}
