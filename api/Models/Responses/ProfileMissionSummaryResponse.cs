namespace Bts.Api.Models.Responses;

public sealed class ProfileMissionItemResponse
{
    public string Id { get; set; } = string.Empty;
    public string Scope { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Progress { get; set; }
    public int Target { get; set; }
    public string UnitLabel { get; set; } = string.Empty;
    public bool IsComplete { get; set; }
    public int RewardXp { get; set; }
}

public sealed class ProfileStreakRewardResponse
{
    public int CurrentBestStreak { get; set; }
    public int NextTarget { get; set; }
    public int RewardXp { get; set; }
    public string RewardLabel { get; set; } = string.Empty;
    public bool IsUnlocked { get; set; }
}

public sealed class ProfileMissionSummaryResponse
{
    public IReadOnlyList<ProfileMissionItemResponse> DailyMissions { get; set; } = Array.Empty<ProfileMissionItemResponse>();
    public IReadOnlyList<ProfileMissionItemResponse> WeeklyMissions { get; set; } = Array.Empty<ProfileMissionItemResponse>();
    public ProfileStreakRewardResponse StreakReward { get; set; } = new();
}
