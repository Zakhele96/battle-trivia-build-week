namespace Bts.Api.Models.Dtos;

public sealed class TriviaCorrectAnswerResult
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string SubmittedAnswer { get; set; } = string.Empty;
    public int CorrectRank { get; set; }
    public int PointsAwarded { get; set; }
    public DateTime SubmittedAt { get; set; }
}