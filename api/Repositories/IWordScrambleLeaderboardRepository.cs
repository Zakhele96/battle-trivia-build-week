using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface IWordScrambleLeaderboardRepository
{
    Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetSessionLeaderboardAsync(Guid sessionId, int take = 10);
    Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetRoomLeaderboardAsync(Guid roomId, int take = 10);
    Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetGlobalLeaderboardAsync(int take = 10);
}