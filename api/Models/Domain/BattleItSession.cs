namespace Bts.Api.Models.Domain;

public sealed class BattleItSession
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid CreatorUserId { get; set; }
    public string CreatorDisplayName { get; set; } = string.Empty;
    public Guid? GameSessionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public string SourceType { get; set; } = "text";
    public string? SourceLabel { get; set; }
    public string Difficulty { get; set; } = "medium";
    public int QuestionDurationSeconds { get; set; } = 20;
    public int RevealDelaySeconds { get; set; } = 5;
    public string Model { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public sealed class BattleItQuestion
{
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public int Position { get; set; }
    public string Concept { get; set; } = string.Empty;
    public string SourceExcerpt { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public string AcceptedAnswersJson { get; set; } = "[]";
    public string AnswerExplanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "medium";
}

public sealed class BattleItGeneratedPack
{
    public string Title { get; set; } = string.Empty;
    public List<string> KeyConcepts { get; set; } = [];
    public List<BattleItGeneratedQuestion> Questions { get; set; } = [];
}

public sealed class BattleItGeneratedQuestion
{
    public string Concept { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public List<string> AcceptedAnswers { get; set; } = [];
    public string Difficulty { get; set; } = "medium";
    public string AnswerExplanation { get; set; } = string.Empty;
    public string SourceExcerpt { get; set; } = string.Empty;
}
