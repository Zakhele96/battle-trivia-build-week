namespace Bts.Api.Models.Domain;

public sealed class ChallengeInvite
{
    public Guid Id { get; set; }
    public Guid ChallengerUserId { get; set; }
    public Guid RivalUserId { get; set; }
    public string Mode { get; set; } = "combined";
    public string Period { get; set; } = "current";
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
