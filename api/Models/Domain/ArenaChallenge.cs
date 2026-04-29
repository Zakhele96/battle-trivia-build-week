namespace Bts.Api.Models.Domain;

public sealed class ArenaChallenge
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ChallengeType { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string? Rules { get; set; }
    public int MaxEntries { get; set; }
    public string Status { get; set; } = "open";
    public DateTime SubmissionEndsAt { get; set; }
    public DateTime? VotingStartsAt { get; set; }
    public DateTime VotingEndsAt { get; set; }
    public Guid? WinnerEntryId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
