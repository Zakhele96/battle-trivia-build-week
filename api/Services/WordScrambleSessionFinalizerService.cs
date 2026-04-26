using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class WordScrambleSessionFinalizerService
{
    private readonly IWordScrambleLeaderboardRepository _leaderboardRepository;
    private readonly IWordScrambleSessionResultRepository _sessionResultRepository;

    public WordScrambleSessionFinalizerService(
        IWordScrambleLeaderboardRepository leaderboardRepository,
        IWordScrambleSessionResultRepository sessionResultRepository)
    {
        _leaderboardRepository = leaderboardRepository;
        _sessionResultRepository = sessionResultRepository;
    }

    public async Task<IReadOnlyList<WordScrambleSessionResultRowDto>> FinalizeSessionAsync(Guid sessionId)
    {
        var alreadySnapshotted = await _sessionResultRepository.ExistsForSessionAsync(sessionId);
        if (alreadySnapshotted)
        {
            return await _sessionResultRepository.GetBySessionIdAsync(sessionId, 10);
        }

        var leaderboard = (await _leaderboardRepository.GetSessionLeaderboardAsync(sessionId, 1000)).ToList();
        var snapshotCreatedAt = DateTime.UtcNow;

        var snapshotRows = leaderboard.Select(x => new WordScrambleSessionResult
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            UserId = x.UserId,
            Rank = x.Rank,
            Score = x.Score,
            CreatedAt = snapshotCreatedAt
        }).ToList();

        if (snapshotRows.Count > 0)
        {
            await _sessionResultRepository.CreateManyAsync(snapshotRows);
        }

        return snapshotRows
            .Select((x, i) => new WordScrambleSessionResultRowDto
            {
                UserId = x.UserId,
                Username = leaderboard[i].Username,
                DisplayName = leaderboard[i].DisplayName,
                Score = x.Score,
                Rank = x.Rank
            })
            .OrderBy(x => x.Rank)
            .ThenByDescending(x => x.Score)
            .Take(10)
            .ToList();
    }
}
