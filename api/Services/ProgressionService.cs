using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class ProgressionService
{
    private readonly IAchievementRepository _achievementRepository;
    private readonly IProfileProgressionRepository _profileProgressionRepository;

    public ProgressionService(
        IAchievementRepository achievementRepository,
        IProfileProgressionRepository profileProgressionRepository)
    {
        _achievementRepository = achievementRepository;
        _profileProgressionRepository = profileProgressionRepository;
    }

    public async Task<ProfileProgressionResponse> GetForUserAsync(Guid userId)
    {
        var result = await EvaluateAndAwardAsync(userId);
        return result.Progression;
    }

    public async Task<ProgressionEvaluationResult> EvaluateAndAwardAsync(Guid userId)
    {
        var definitions = await _achievementRepository.GetActiveDefinitionsAsync();
        var earnedCodes = (await _achievementRepository.GetEarnedCodesAsync(userId)).ToHashSet();
        var snapshot = await _profileProgressionRepository.GetSnapshotAsync(userId);

        var newlyUnlocked = new List<ProfileAchievementResponse>();

        foreach (var definition in definitions)
        {
            if (earnedCodes.Contains(definition.Code))
                continue;

            if (!HasMetCondition(definition.Code, snapshot))
                continue;

            var earnedAt = DateTime.UtcNow;

            await _achievementRepository.AddUserAchievementAsync(new UserAchievement
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AchievementDefinitionId = definition.Id,
                EarnedAt = earnedAt
            });

            earnedCodes.Add(definition.Code);

            newlyUnlocked.Add(new ProfileAchievementResponse
            {
                Code = definition.Code,
                Name = definition.Name,
                Description = definition.Description,
                BadgeLabel = definition.BadgeLabel,
                IconKey = definition.IconKey,
                XpReward = definition.XpReward,
                EarnedAt = earnedAt
            });
        }

        var xpTotal = definitions
            .Where(d => earnedCodes.Contains(d.Code))
            .Sum(d => d.XpReward);

        var level = CalculateLevel(xpTotal);

        await _achievementRepository.UpsertUserProgressAsync(new UserProgress
        {
            UserId = userId,
            XpTotal = xpTotal,
            Level = level,
            UpdatedAt = DateTime.UtcNow
        });

        var recentAchievements = await _achievementRepository.GetRecentAchievementsAsync(userId, 6);

        return new ProgressionEvaluationResult
        {
            Progression = new ProfileProgressionResponse
            {
                XpTotal = xpTotal,
                Level = level,
                CurrentLevelStartXp = GetXpRequiredForLevel(level),
                NextLevelXp = GetXpRequiredForLevel(level + 1),
                AchievementsCount = earnedCodes.Count,
                RecentAchievements = recentAchievements
            },
            NewlyUnlockedAchievements = newlyUnlocked
        };
    }

    private static bool HasMetCondition(string code, ProfileProgressionSnapshot snapshot)
    {
        return code switch
        {
            "first_win" => snapshot.BestRank == 1,
            "top3_finish" => snapshot.BestRank is >= 1 and <= 3,
            "top10_finish" => snapshot.BestRank is >= 1 and <= 10,
            "rank_2_finish" => snapshot.BestRank == 2,
            "weekly_champion" => snapshot.WeeklyWins > 0,
            "weekly_champion_5" => snapshot.WeeklyWins >= 5,
            "weekly_champion_10" => snapshot.WeeklyWins >= 10,
            "hot_streak_5" => snapshot.BestStreak >= 5,
            "hot_streak_10" => snapshot.BestStreak >= 10,
            "hot_streak_20" => snapshot.BestStreak >= 20,
            "fastest_answer" => snapshot.FastestCorrectAnswerMs.HasValue && snapshot.FastestCorrectAnswerMs.Value <= 1500,
            "fastest_answer_1s" => snapshot.FastestCorrectAnswerMs.HasValue && snapshot.FastestCorrectAnswerMs.Value <= 1000,
            "correct_10" => snapshot.TotalCorrectAnswers >= 10,
            "correct_100" => snapshot.TotalCorrectAnswers >= 100,
            "correct_250" => snapshot.TotalCorrectAnswers >= 250,
            "correct_500" => snapshot.TotalCorrectAnswers >= 500,
            "sessions_played_5" => snapshot.SessionsPlayed >= 5,
            "sessions_played_25" => snapshot.SessionsPlayed >= 25,
            "sessions_played_100" => snapshot.SessionsPlayed >= 100,
            _ => false
        };
    }

    private static int CalculateLevel(int xpTotal)
    {
        var level = 1;

        while (xpTotal >= GetXpRequiredForLevel(level + 1))
        {
            level++;
        }

        return level;
    }

    private static int GetXpRequiredForLevel(int level)
    {
        if (level <= 1)
            return 0;

        return 100 * (level - 1) * level / 2;
    }
}
