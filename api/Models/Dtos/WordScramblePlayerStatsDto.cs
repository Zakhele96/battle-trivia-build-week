namespace Bts.Api.Models.Dtos;

public sealed class WordScramblePlayerStatsDto
{
    public int CorrectAnswers { get; set; }
    public int CurrentStreak { get; set; }
    public int BestStreak { get; set; }
    public double? FastestSolveSeconds { get; set; }
    public double? AverageSolveSeconds { get; set; }
    public double? LatestSolveSeconds { get; set; }
}
