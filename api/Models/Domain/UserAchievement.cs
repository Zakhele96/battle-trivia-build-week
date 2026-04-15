namespace Bts.Api.Models.Domain;

public sealed class UserAchievement
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AchievementDefinitionId { get; set; }
    public DateTime EarnedAt { get; set; }
    public string? ContextJson { get; set; }
}