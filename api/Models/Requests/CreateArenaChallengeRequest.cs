namespace Bts.Api.Models.Requests;

public sealed class CreateArenaChallengeRequest
{
    public string Title { get; set; } = string.Empty;
    public string ChallengeType { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string? Rules { get; set; }
    public int MaxEntries { get; set; } = 8;
    public int SubmissionDurationHours { get; set; } = 24;
    public int VotingDurationHours { get; set; } = 24;
}
