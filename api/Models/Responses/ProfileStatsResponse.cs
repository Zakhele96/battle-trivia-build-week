namespace Bts.Api.Models.Responses;

public sealed class ProfileStatsResponse
{
    public int TotalCorrectAnswers { get; set; }
    public int WordScrambleCorrectAnswers { get; set; }
    public int BestStreak { get; set; }
    public int WeeklyWins { get; set; }
    public int? FastestCorrectAnswerMs { get; set; }
}
