using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class BattleTriviaSessionSummaryService
{
    private const string BattleTriviaSlug = "battle-trivia";

    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;
    private readonly ITriviaSessionResultRepository _triviaSessionResultRepository;
    private readonly IBattleTriviaSessionSummaryRepository _battleTriviaSessionSummaryRepository;

    public BattleTriviaSessionSummaryService(
        IRoomRepository roomRepository,
        ITriviaSessionRepository triviaSessionRepository,
        ITriviaSessionResultRepository triviaSessionResultRepository,
        IBattleTriviaSessionSummaryRepository battleTriviaSessionSummaryRepository)
    {
        _roomRepository = roomRepository;
        _triviaSessionRepository = triviaSessionRepository;
        _triviaSessionResultRepository = triviaSessionResultRepository;
        _battleTriviaSessionSummaryRepository = battleTriviaSessionSummaryRepository;
    }

    public async Task<BattleTriviaSessionSummaryDto> GetLatestForUserAsync(Guid userId)
    {
        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
        {
            return new BattleTriviaSessionSummaryDto { HasSummary = false };
        }

        var session = await _triviaSessionRepository.GetLatestEndedByRoomIdAsync(room.Id);
        if (session is null)
        {
            return new BattleTriviaSessionSummaryDto { HasSummary = false };
        }

        var resultTask = _triviaSessionResultRepository.GetUserBySessionIdAsync(session.Id, userId);
        var correctCountTask = _battleTriviaSessionSummaryRepository.GetCorrectCountAsync(session.Id, userId);
        var bestStreakTask = _battleTriviaSessionSummaryRepository.GetBestStreakAsync(session.Id, userId);
        var fastestTask = _battleTriviaSessionSummaryRepository.GetFastestCorrectAnswerMsAsync(session.Id, userId);

        await Task.WhenAll(resultTask, correctCountTask, bestStreakTask, fastestTask);

        var result = resultTask.Result;

        return new BattleTriviaSessionSummaryDto
        {
            HasSummary = true,
            SessionId = session.Id,
            EndedAt = session.EndedAt,
            FinalRank = result?.Rank,
            TotalScore = result?.Score ?? 0,
            TotalCorrectAnswers = correctCountTask.Result,
            BestStreak = bestStreakTask.Result,
            FastestCorrectAnswerMs = fastestTask.Result,
            IsChampion = result?.Rank == 1,
            IsTopThree = result?.Rank is >= 1 and <= 3
        };
    }

    public async Task<BattleTriviaWeeklyPodiumDto> GetLatestPodiumAsync()
    {
        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
        {
            return new BattleTriviaWeeklyPodiumDto { HasPodium = false };
        }

        var session = await _triviaSessionRepository.GetLatestEndedByRoomIdAsync(room.Id);
        if (session is null)
        {
            return new BattleTriviaWeeklyPodiumDto { HasPodium = false };
        }

        var winners = await _triviaSessionResultRepository.GetBySessionIdAsync(session.Id, 3);

        return new BattleTriviaWeeklyPodiumDto
        {
            HasPodium = winners.Count > 0,
            SessionId = session.Id,
            EndedAt = session.EndedAt,
            Winners = winners
        };
    }
}