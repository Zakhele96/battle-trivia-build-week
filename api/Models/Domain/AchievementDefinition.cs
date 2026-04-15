namespace Bts.Api.Models.Domain;

public sealed class AchievementDefinition
{
    public Guid Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string BadgeLabel { get; set; } = "";
    public string IconKey { get; set; } = "";
    public int XpReward { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}