namespace Bts.Api.Models.Domain;

public sealed class ArenaVote
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid EntryId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
