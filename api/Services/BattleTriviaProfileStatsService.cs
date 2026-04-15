using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class BattleTriviaProfileStatsService
{
    private const string BattleTriviaSlug = "battle-trivia";

    private readonly IBattleTriviaProfileStatsRepository _profileStatsRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;

    public BattleTriviaProfileStatsService(
        IBattleTriviaProfileStatsRepository profileStatsRepository,
        IRoomRepository roomRepository,
        ITriviaSessionRepository triviaSessionRepository)
    {
        _profileStatsRepository = profileStatsRepository;
        _roomRepository = roomRepository;
        _triviaSessionRepository = triviaSessionRepository;
    }

    public async Task<BattleTriviaProfileStatsDto> GetForUserAsync(Guid userId)
    {
        var totalCorrectAnswersTask = _profileStatsRepository.GetTotalCorrectAnswersAsync(userId);
        var bestStreakTask = _profileStatsRepository.GetBestStreakAsync(userId);
        var weeklyWinsTask = _profileStatsRepository.GetWeeklyWinsAsync(userId);
        var fastestCorrectAnswerTask = _profileStatsRepository.GetFastestCorrectAnswerMsAsync(userId);
        var currentWeeklyRankTask = GetCurrentWeeklyRankAsync(userId);

        await Task.WhenAll(
            totalCorrectAnswersTask,
            bestStreakTask,
            weeklyWinsTask,
            fastestCorrectAnswerTask,
            currentWeeklyRankTask);

        return new BattleTriviaProfileStatsDto
        {
            TotalCorrectAnswers = totalCorrectAnswersTask.Result,
            BestStreak = bestStreakTask.Result,
            WeeklyWins = weeklyWinsTask.Result,
            FastestCorrectAnswerMs = fastestCorrectAnswerTask.Result,
            CurrentWeeklyRank = currentWeeklyRankTask.Result
        };
    }

    private async Task<int?> GetCurrentWeeklyRankAsync(Guid userId)
    {
        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
            return null;

        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
            return null;

        return await _profileStatsRepository.GetCurrentWeeklyRankAsync(session.Id, userId);
    }
}