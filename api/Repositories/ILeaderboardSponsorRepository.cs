using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface ILeaderboardSponsorRepository
{
    Task<LeaderboardSponsorDto?> GetActiveAsync(string leaderboardMode, DateTime nowUtc);
    Task<IReadOnlyList<LeaderboardSponsorDto>> GetAllAsync();
    Task<LeaderboardSponsorDto?> GetByIdAsync(Guid id);
    Task CreateAsync(
        LeaderboardSponsor sponsor,
        IReadOnlyList<LeaderboardSponsorPlacement> placements);
    Task UpdateAsync(
        LeaderboardSponsor sponsor,
        IReadOnlyList<LeaderboardSponsorPlacement> placements);
    Task SetActiveAsync(Guid id, bool isActive);
}
