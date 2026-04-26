namespace Bts.Api.Models.Responses;

public sealed class ChallengeInviteResponse
{
    public Guid Id { get; set; }
    public Guid ChallengerUserId { get; set; }
    public string ChallengerName { get; set; } = string.Empty;
    public string ChallengerUsername { get; set; } = string.Empty;
    public Guid RivalUserId { get; set; }
    public string Mode { get; set; } = "combined";
    public string Period { get; set; } = "current";
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
