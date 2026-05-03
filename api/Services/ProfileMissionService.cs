using Bts.Api.Data;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Services;

public sealed class ProfileMissionService
{
    private readonly DapperContext _context;
    private readonly BattleTriviaProfileStatsService _battleTriviaProfileStatsService;
    private readonly GameLeaderboardService _gameLeaderboardService;

    public ProfileMissionService(
        DapperContext context,
        BattleTriviaProfileStatsService battleTriviaProfileStatsService,
        GameLeaderboardService gameLeaderboardService)
    {
        _context = context;
        _battleTriviaProfileStatsService = battleTriviaProfileStatsService;
        _gameLeaderboardService = gameLeaderboardService;
    }

    public async Task<ProfileMissionSummaryResponse> GetForUserAsync(Guid userId)
    {
        const string todaySql = """
            WITH trivia_correct AS (
                SELECT COUNT(*)::int AS value
                FROM trivia_answers
                WHERE user_id = @UserId
                  AND is_correct = TRUE
                  AND submitted_at >= date_trunc('day', NOW())
            ),
            scramble_correct AS (
                SELECT COUNT(*)::int AS value
                FROM word_scramble_answers
                WHERE user_id = @UserId
                  AND is_correct = TRUE
                  AND submitted_at >= date_trunc('day', NOW())
            ),
            trivia_sessions AS (
                SELECT COUNT(*)::int AS value
                FROM trivia_session_results r
                INNER JOIN trivia_game_sessions s
                    ON s.id = r.session_id
                WHERE r.user_id = @UserId
                  AND COALESCE(s.ended_at, s.period_end, s.started_at) >= date_trunc('day', NOW())
            )
            SELECT
                (SELECT value FROM trivia_correct) AS TriviaCorrectToday,
                (SELECT value FROM scramble_correct) AS WordScrambleCorrectToday,
                (SELECT value FROM trivia_sessions) AS TriviaSessionsToday;
            """;

        using var connection = _context.CreateConnection();
        var today = await connection.QuerySingleAsync<TodayMissionSnapshot>(todaySql, new { UserId = userId });

        var combinedBoard = await _gameLeaderboardService.GetAsync("combined", "current", 1000);
        var triviaBoard = await _gameLeaderboardService.GetAsync("battle-trivia", "current", 1000);
        var currentCombined = combinedBoard.Rows.FirstOrDefault(row => row.UserId == userId);
        var currentTrivia = triviaBoard.Rows.FirstOrDefault(row => row.UserId == userId);
        var stats = await _battleTriviaProfileStatsService.GetForUserAsync(userId);

        var weeklyScore = currentCombined?.Score ?? 0;
        var weeklyRankProgress = currentCombined is not null && currentCombined.Rank <= 10 ? 1 : 0;
        var weeklyTriviaLead = currentTrivia?.Rank == 1 ? 1 : 0;

        return new ProfileMissionSummaryResponse
        {
            DailyMissions = new[]
            {
                BuildMission("daily-correct-trivia", "daily", "Land 5 trivia answers today", "Keep your touch warm with five correct Battle Trivia answers today.", today.TriviaCorrectToday, 5, "answers", 20),
                BuildMission("daily-scramble-solves", "daily", "Solve 3 scramble rounds today", "Jump into Word Scramble and convert three correct solves today.", today.WordScrambleCorrectToday, 3, "solves", 20),
                BuildMission("daily-play-session", "daily", "Finish 1 trivia session today", "Show up for at least one completed Battle Trivia session today.", today.TriviaSessionsToday, 1, "sessions", 25)
            },
            WeeklyMissions = new[]
            {
                BuildMission("weekly-score-25", "weekly", "Reach 25 combined points", "Keep climbing until your combined weekly score reaches 25 points.", weeklyScore, 25, "pts", 35),
                BuildMission("weekly-top10", "weekly", "Break into the top 10", "Get your name onto the top 10 of the combined weekly board.", weeklyRankProgress, 1, "board", 45),
                BuildMission("weekly-trivia-lead", "weekly", "Lead Battle Trivia", "Take over the current Battle Trivia board, even if it is just for today.", weeklyTriviaLead, 1, "lead", 60)
            },
            StreakReward = BuildStreakReward(stats.BestStreak)
        };
    }

    private static ProfileMissionItemResponse BuildMission(
        string id,
        string scope,
        string title,
        string description,
        int progress,
        int target,
        string unitLabel,
        int rewardXp)
    {
        var safeProgress = Math.Max(0, progress);
        return new ProfileMissionItemResponse
        {
            Id = id,
            Scope = scope,
            Title = title,
            Description = description,
            Progress = Math.Min(safeProgress, target),
            Target = target,
            UnitLabel = unitLabel,
            IsComplete = safeProgress >= target,
            RewardXp = rewardXp
        };
    }

    private static ProfileStreakRewardResponse BuildStreakReward(int bestStreak)
    {
        var milestones = new[]
        {
            new { Target = 5, Xp = 60, Label = "Hot Streak badge" },
            new { Target = 10, Xp = 110, Label = "Streak x10 badge" },
            new { Target = 20, Xp = 180, Label = "Streak x20 badge" },
            new { Target = 30, Xp = 260, Label = "Streak x30 badge" }
        };

        var next = milestones.FirstOrDefault(item => bestStreak < item.Target) ?? milestones[^1];
        var unlocked = bestStreak >= next.Target;

        return new ProfileStreakRewardResponse
        {
            CurrentBestStreak = bestStreak,
            NextTarget = next.Target,
            RewardXp = next.Xp,
            RewardLabel = next.Label,
            IsUnlocked = unlocked
        };
    }

    private sealed class TodayMissionSnapshot
    {
        public int TriviaCorrectToday { get; set; }
        public int WordScrambleCorrectToday { get; set; }
        public int TriviaSessionsToday { get; set; }
    }
}
