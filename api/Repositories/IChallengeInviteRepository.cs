using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IChallengeInviteRepository
{
    Task<ChallengeInvite?> GetPendingAsync(Guid challengerUserId, Guid rivalUserId, string mode, string period);
    Task CreateAsync(ChallengeInvite invite);
    Task<IReadOnlyList<ChallengeInviteResponse>> GetForRivalAsync(Guid rivalUserId);
    Task<ChallengeInvite?> GetByIdAsync(Guid id);
    Task UpdateStatusAsync(Guid id, string status, DateTime respondedAtUtc);
}
