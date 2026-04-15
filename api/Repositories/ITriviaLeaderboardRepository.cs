using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface ITriviaLeaderboardRepository
{
    Task<IEnumerable<TriviaLeaderboardEntryDto>> GetSessionLeaderboardAsync(Guid sessionId, int take = 5);
    Task<TriviaPlayerRankDto?> GetPlayerRankAsync(Guid sessionId, Guid userId);
}