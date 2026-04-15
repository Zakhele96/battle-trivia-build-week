namespace Bts.Api.Models.Dtos;

public sealed class BattleTriviaSessionSummaryDto
{
    public bool HasSummary { get; set; }
    public Guid? SessionId { get; set; }
    public DateTime? EndedAt { get; set; }

    public int? FinalRank { get; set; }
    public int TotalScore { get; set; }
    public int TotalCorrectAnswers { get; set; }
    public int BestStreak { get; set; }
    public int? FastestCorrectAnswerMs { get; set; }

    public bool IsChampion { get; set; }
    public bool IsTopThree { get; set; }
}