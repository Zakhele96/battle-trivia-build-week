using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class TriviaSessionFinalizerService
{
    private readonly ITriviaLeaderboardRepository _triviaLeaderboardRepository;
    private readonly ITriviaSessionResultRepository _triviaSessionResultRepository;
    private readonly ProgressionService _progressionService;
    private readonly ProgressionRealtimeService _progressionRealtimeService;

    public TriviaSessionFinalizerService(
        ITriviaLeaderboardRepository triviaLeaderboardRepository,
        ITriviaSessionResultRepository triviaSessionResultRepository,
        ProgressionService progressionService,
        ProgressionRealtimeService progressionRealtimeService)
    {
        _triviaLeaderboardRepository = triviaLeaderboardRepository;
        _triviaSessionResultRepository = triviaSessionResultRepository;
        _progressionService = progressionService;
        _progressionRealtimeService = progressionRealtimeService;
    }

    public async Task<IReadOnlyList<TriviaSessionResultRowDto>> FinalizeSessionAsync(Guid sessionId)
    {
        var alreadySnapshotted = await _triviaSessionResultRepository.ExistsForSessionAsync(sessionId);
        if (alreadySnapshotted)
        {
            return await _triviaSessionResultRepository.GetBySessionIdAsync(sessionId, 10);
        }

        var leaderboard = (await _triviaLeaderboardRepository.GetSessionLeaderboardAsync(sessionId, 1000)).ToList();

        var snapshotCreatedAt = DateTime.UtcNow;

        var snapshotRows = leaderboard.Select(x => new TriviaSessionResult
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
            await _triviaSessionResultRepository.CreateManyAsync(snapshotRows);

            var userIds = snapshotRows
                .Select(x => x.UserId)
                .Distinct()
                .ToList();

            foreach (var userId in userIds)
            {
                var progressionResult = await _progressionService.EvaluateAndAwardAsync(userId);
                await _progressionRealtimeService.NotifyAsync(userId, progressionResult);
            }
        }

        return snapshotRows
            .Select((x, i) => new TriviaSessionResultRowDto
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