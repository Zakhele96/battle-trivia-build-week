namespace Bts.Api.Models.Dtos;

public sealed class TriviaRoundDetails
{
    public Guid RoundId { get; set; }
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public int RoundNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime EndsAt { get; set; }

    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public string AcceptedAnswersJson { get; set; } = "[]";
}