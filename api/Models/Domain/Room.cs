namespace Bts.Api.Models.Domain;

public sealed class Room
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RoomType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int SlowModeSeconds { get; set; }
    public int BattleTriviaQuestionDurationSeconds { get; set; } = 20;
    public int BattleTriviaRevealDelaySeconds { get; set; } = 5;
    public int WordScrambleRoundDurationSeconds { get; set; } = 30;
    public int WordScrambleRevealDurationSeconds { get; set; } = 5;
    public DateTime CreatedAt { get; set; }
}
