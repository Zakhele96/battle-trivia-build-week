namespace Bts.Api.Models.Dtos;

public sealed class BattleTriviaProfileStatsDto
{
    public int TotalCorrectAnswers { get; set; }
    public int BestStreak { get; set; }
    public int WeeklyWins { get; set; }
    public int? FastestCorrectAnswerMs { get; set; }
    public int? CurrentWeeklyRank { get; set; }
}