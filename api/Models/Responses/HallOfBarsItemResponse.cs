namespace Bts.Api.Models.Responses;

public sealed class HallOfBarsItemResponse
{
    public Guid ChallengeId { get; set; }
    public Guid EntryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ChallengeType { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string WinnerUsername { get; set; } = string.Empty;
    public string WinnerDisplayName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public DateTime ClosedAt { get; set; }
}
