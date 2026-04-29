namespace Bts.Api.Models.Responses;

public sealed class ArenaChallengeResponse
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public string CreatedByDisplayName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ChallengeType { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string? Rules { get; set; }
    public int MaxEntries { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime SubmissionEndsAt { get; set; }
    public DateTime? VotingStartsAt { get; set; }
    public DateTime VotingEndsAt { get; set; }
    public Guid? WinnerEntryId { get; set; }
    public string? WinnerDisplayName { get; set; }
    public int EntryCount { get; set; }
    public int VoteCount { get; set; }
    public bool UserHasSubmitted { get; set; }
    public bool UserHasVoted { get; set; }
    public DateTime CreatedAt { get; set; }
}
