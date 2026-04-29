namespace Bts.Api.Models.Domain;

public sealed class ArenaEntry
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}
