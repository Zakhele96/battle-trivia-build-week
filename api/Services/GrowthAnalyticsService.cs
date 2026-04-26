using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class GrowthAnalyticsService
{
    private readonly IGrowthRepository _growthRepository;
    private readonly IUserRepository _userRepository;

    public GrowthAnalyticsService(
        IGrowthRepository growthRepository,
        IUserRepository userRepository)
    {
        _growthRepository = growthRepository;
        _userRepository = userRepository;
    }

    public async Task TrackShareViewAsync(Guid sharerUserId, string mode, string period, string? userAgent)
    {
        await _growthRepository.TrackShareEventAsync(
            sharerUserId,
            "view",
            NormalizeMode(mode),
            NormalizePeriod(period),
            "leaderboard-share",
            userAgent);
    }

    public async Task TrackShareJoinClickAsync(Guid sharerUserId, string mode, string period, string? userAgent)
    {
        await _growthRepository.TrackShareEventAsync(
            sharerUserId,
            "cta-click",
            NormalizeMode(mode),
            NormalizePeriod(period),
            "leaderboard-share",
            userAgent);
    }

    public async Task RecordReferralSignupAsync(
        Guid referrerUserId,
        Guid referredUserId,
        string? sourceContext,
        string? mode,
        string? period)
    {
        if (referrerUserId == Guid.Empty || referredUserId == Guid.Empty || referrerUserId == referredUserId)
            return;

        var referrer = await _userRepository.GetByIdAsync(referrerUserId);
        if (referrer is null || !referrer.IsActive)
            return;

        await _growthRepository.RecordReferralSignupAsync(
            referrerUserId,
            referredUserId,
            string.IsNullOrWhiteSpace(sourceContext) ? "leaderboard-share" : sourceContext.Trim(),
            string.IsNullOrWhiteSpace(mode) ? null : NormalizeMode(mode),
            string.IsNullOrWhiteSpace(period) ? null : NormalizePeriod(period));
    }

    public Task<GrowthSummaryResponse> GetUserSummaryAsync(Guid userId)
    {
        return _growthRepository.GetUserSummaryAsync(userId);
    }

    public Task<AdminGrowthSnapshotResponse> GetAdminSnapshotAsync()
    {
        return _growthRepository.GetAdminSnapshotAsync();
    }

    private static string NormalizeMode(string? mode)
    {
        return mode switch
        {
            "battle-trivia" => "battle-trivia",
            "word-scramble" => "word-scramble",
            _ => "combined"
        };
    }

    private static string NormalizePeriod(string? period)
    {
        return string.Equals(period, "previous", StringComparison.OrdinalIgnoreCase)
            ? "previous"
            : "current";
    }
}
