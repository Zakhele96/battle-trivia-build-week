namespace Bts.Api.Models.Requests;

public sealed class UpdateBattleItDraftRequest
{
    public string Title { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "medium";
    public string AnswerMode { get; set; } = "text";
    public string Visibility { get; set; } = "code-only";
    public int QuestionDurationSeconds { get; set; } = 20;
    public int RevealDelaySeconds { get; set; } = 5;
    public List<UpdateBattleItQuestionRequest> Questions { get; set; } = [];
}

public sealed class UpdateBattleItQuestionRequest
{
    public Guid QuestionId { get; set; }
    public string Concept { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public List<string> AcceptedAnswers { get; set; } = [];
    public List<string> AnswerOptions { get; set; } = [];
    public string Difficulty { get; set; } = "medium";
    public string AnswerExplanation { get; set; } = string.Empty;
    public string SourceExcerpt { get; set; } = string.Empty;
}
