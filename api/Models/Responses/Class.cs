namespace Bts.Api.Models.Responses;

public sealed class ProfileProgressionResponse
{
    public int XpTotal { get; set; }
    public int Level { get; set; }
    public int CurrentLevelStartXp { get; set; }
    public int NextLevelXp { get; set; }
    public int AchievementsCount { get; set; }
    public IReadOnlyList<ProfileAchievementResponse> RecentAchievements { get; set; } =
        Array.Empty<ProfileAchievementResponse>();
}