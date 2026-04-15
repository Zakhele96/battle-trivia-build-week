namespace Bts.Api.Models.Domain;

public sealed class WordScrambleAnswer
{
    public Guid Id { get; set; }
    public Guid RoundId { get; set; }
    public Guid UserId { get; set; }
    public string SubmittedAnswer { get; set; } = string.Empty;
    public string NormalizedAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int? CorrectRank { get; set; }
    public int PointsAwarded { get; set; }
    public DateTime SubmittedAt { get; set; }
}