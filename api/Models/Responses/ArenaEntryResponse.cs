namespace Bts.Api.Models.Responses;

public sealed class ArenaEntryResponse
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Content { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public bool HasCurrentUserVoted { get; set; }
    public bool IsWinner { get; set; }
    public DateTime SubmittedAt { get; set; }
}
