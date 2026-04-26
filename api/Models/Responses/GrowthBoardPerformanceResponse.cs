namespace Bts.Api.Models.Responses;

public sealed class GrowthBoardPerformanceResponse
{
    public string LeaderboardMode { get; set; } = string.Empty;
    public string LeaderboardPeriod { get; set; } = string.Empty;
    public int ShareViews { get; set; }
    public int JoinClicks { get; set; }
    public int ReferredSignups { get; set; }
}
