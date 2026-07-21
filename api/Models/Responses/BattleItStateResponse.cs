namespace Bts.Api.Models.Responses;

public sealed class BattleItStateResponse
{
    public Guid RoomId { get; set; }
    public Guid? SessionId { get; set; }
    public Guid? GameSessionId { get; set; }
    public string Status { get; set; } = "idle";
    public string Title { get; set; } = "Battle It";
    public Guid? CreatorUserId { get; set; }
    public string? CreatorDisplayName { get; set; }
    public bool IsCreator { get; set; }
    public string? SourceType { get; set; }
    public string? SourceLabel { get; set; }
    public string Difficulty { get; set; } = "medium";
    public int QuestionDurationSeconds { get; set; } = 20;
    public int RevealDelaySeconds { get; set; } = 5;
    public int QuestionCount { get; set; }
    public int CurrentQuestionNumber { get; set; }
    public int CoveredConceptCount { get; set; }
    public string? Model { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public IReadOnlyList<BattleItQuestionResponse> Questions { get; set; } = [];
    public IReadOnlyList<BattleItPodiumRowResponse> Podium { get; set; } = [];
}

public sealed class BattleItQuestionResponse
{
    public Guid QuestionId { get; set; }
    public int Position { get; set; }
    public string Concept { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public IReadOnlyList<string> AcceptedAnswers { get; set; } = [];
    public string Difficulty { get; set; } = "medium";
    public string AnswerExplanation { get; set; } = string.Empty;
    public string SourceExcerpt { get; set; } = string.Empty;
}

public sealed class BattleItPodiumRowResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int Score { get; set; }
    public int Rank { get; set; }
}
