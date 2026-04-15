namespace Bts.Api.Models.Dtos;

public sealed class SubmitTriviaAnswerResult
{
    public bool Success { get; set; }
    public bool IsCorrect { get; set; }
    public bool AlreadyAnsweredCorrectly { get; set; }
    public Guid? SessionId { get; set; }
    public Guid? RoundId { get; set; }
    public Guid UserId { get; set; }
    public string? DisplayName { get; set; }
    public string SubmittedAnswer { get; set; } = string.Empty;
    public string NormalizedAnswer { get; set; } = string.Empty;
    public int? CorrectRank { get; set; }
    public int PointsAwarded { get; set; }
    public string Message { get; set; } = string.Empty;

    public int WrongAttemptsUsed { get; set; }
    public int WrongAttemptsLeft { get; set; }
    public int MaxWrongAttempts { get; set; }
}