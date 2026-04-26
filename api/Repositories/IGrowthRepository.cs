using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IGrowthRepository
{
    Task TrackShareEventAsync(
        Guid sharerUserId,
        string eventType,
        string leaderboardMode,
        string leaderboardPeriod,
        string sourceContext,
        string? userAgent);

    Task RecordReferralSignupAsync(
        Guid referrerUserId,
        Guid referredUserId,
        string sourceContext,
        string? leaderboardMode,
        string? leaderboardPeriod);

    Task<GrowthSummaryResponse> GetUserSummaryAsync(Guid userId);
    Task<AdminGrowthSnapshotResponse> GetAdminSnapshotAsync();
}
