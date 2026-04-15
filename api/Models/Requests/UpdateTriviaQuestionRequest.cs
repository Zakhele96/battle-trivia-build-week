namespace Bts.Api.Models.Requests;

public sealed class UpdateTriviaQuestionRequest
{
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public List<string> AcceptedAnswers { get; set; } = new();
    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public bool IsActive { get; set; }
}