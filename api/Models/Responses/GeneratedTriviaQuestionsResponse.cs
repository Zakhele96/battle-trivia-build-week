namespace Bts.Api.Models.Responses;

public sealed class GeneratedTriviaQuestionDraftResponse
{
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public List<string> AcceptedAnswers { get; set; } = new();
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string AnswerExplanation { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public sealed class GeneratedTriviaQuestionsResponse
{
    public List<GeneratedTriviaQuestionDraftResponse> Questions { get; set; } = new();
    public string Model { get; set; } = string.Empty;
}

public sealed class SkippedGeneratedTriviaQuestionResponse
{
    public string QuestionText { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public sealed class SaveGeneratedTriviaQuestionsResponse
{
    public List<TriviaQuestionResponse> Saved { get; set; } = new();
    public List<SkippedGeneratedTriviaQuestionResponse> Skipped { get; set; } = new();
    public int SavedCount => Saved.Count;
    public int SkippedCount => Skipped.Count;
}
