namespace Bts.Api.Models.Requests;

public sealed class CreateChallengeInviteRequest
{
    public Guid RivalUserId { get; set; }
    public string Mode { get; set; } = "combined";
    public string Period { get; set; } = "current";
}
