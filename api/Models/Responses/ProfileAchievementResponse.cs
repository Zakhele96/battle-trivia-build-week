namespace Bts.Api.Models.Responses;

public sealed class ProfileAchievementResponse
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string BadgeLabel { get; set; } = "";
    public string IconKey { get; set; } = "";
    public int XpReward { get; set; }
    public DateTime EarnedAt { get; set; }
}