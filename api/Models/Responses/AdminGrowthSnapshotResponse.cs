namespace Bts.Api.Models.Responses;

public sealed class AdminGrowthSnapshotResponse
{
    public int TotalShareViews { get; set; }
    public int TotalJoinClicks { get; set; }
    public int TotalReferredSignups { get; set; }
    public IReadOnlyList<GrowthTopSharerResponse> TopSharers { get; set; } =
        Array.Empty<GrowthTopSharerResponse>();
    public IReadOnlyList<GrowthBoardPerformanceResponse> BoardPerformance { get; set; } =
        Array.Empty<GrowthBoardPerformanceResponse>();
}
