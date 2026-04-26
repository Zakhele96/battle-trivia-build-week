using Bts.Api.Data;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class GrowthRepository : IGrowthRepository
{
    private readonly DapperContext _context;

    public GrowthRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task TrackShareEventAsync(
        Guid sharerUserId,
        string eventType,
        string leaderboardMode,
        string leaderboardPeriod,
        string sourceContext,
        string? userAgent)
    {
        const string sql = """
            INSERT INTO growth_share_events (
                id,
                sharer_user_id,
                event_type,
                leaderboard_mode,
                leaderboard_period,
                source_context,
                user_agent,
                created_at
            )
            VALUES (
                @Id,
                @SharerUserId,
                @EventType,
                @LeaderboardMode,
                @LeaderboardPeriod,
                @SourceContext,
                @UserAgent,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = Guid.NewGuid(),
            SharerUserId = sharerUserId,
            EventType = eventType,
            LeaderboardMode = leaderboardMode,
            LeaderboardPeriod = leaderboardPeriod,
            SourceContext = sourceContext,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task RecordReferralSignupAsync(
        Guid referrerUserId,
        Guid referredUserId,
        string sourceContext,
        string? leaderboardMode,
        string? leaderboardPeriod)
    {
        const string sql = """
            INSERT INTO growth_referrals (
                id,
                referrer_user_id,
                referred_user_id,
                source_context,
                leaderboard_mode,
                leaderboard_period,
                created_at
            )
            VALUES (
                @Id,
                @ReferrerUserId,
                @ReferredUserId,
                @SourceContext,
                @LeaderboardMode,
                @LeaderboardPeriod,
                @CreatedAt
            )
            ON CONFLICT (referred_user_id) DO NOTHING;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = Guid.NewGuid(),
            ReferrerUserId = referrerUserId,
            ReferredUserId = referredUserId,
            SourceContext = sourceContext,
            LeaderboardMode = leaderboardMode,
            LeaderboardPeriod = leaderboardPeriod,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<GrowthSummaryResponse> GetUserSummaryAsync(Guid userId)
    {
        const string sql = """
            SELECT
                COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0)::int AS ShareViews,
                COALESCE(SUM(CASE WHEN event_type = 'cta-click' THEN 1 ELSE 0 END), 0)::int AS JoinClicks
            FROM growth_share_events
            WHERE sharer_user_id = @UserId;
            """;

        const string referralsSql = """
            SELECT COUNT(*)::int
            FROM growth_referrals
            WHERE referrer_user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        var summary = await connection.QuerySingleAsync<GrowthSummaryResponse>(sql, new { UserId = userId });
        summary.ReferredSignups = await connection.ExecuteScalarAsync<int>(referralsSql, new { UserId = userId });
        return summary;
    }

    public async Task<AdminGrowthSnapshotResponse> GetAdminSnapshotAsync()
    {
        const string totalsSql = """
            SELECT
                COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0)::int AS TotalShareViews,
                COALESCE(SUM(CASE WHEN event_type = 'cta-click' THEN 1 ELSE 0 END), 0)::int AS TotalJoinClicks
            FROM growth_share_events;
            """;

        const string referralsSql = """
            SELECT COUNT(*)::int
            FROM growth_referrals;
            """;

        const string topSharersSql = """
            WITH events AS (
                SELECT
                    gse.sharer_user_id,
                    SUM(CASE WHEN gse.event_type = 'view' THEN 1 ELSE 0 END)::int AS ShareViews,
                    SUM(CASE WHEN gse.event_type = 'cta-click' THEN 1 ELSE 0 END)::int AS JoinClicks
                FROM growth_share_events gse
                GROUP BY gse.sharer_user_id
            ),
            referrals AS (
                SELECT
                    gr.referrer_user_id,
                    COUNT(*)::int AS ReferredSignups
                FROM growth_referrals gr
                GROUP BY gr.referrer_user_id
            )
            SELECT
                u.id AS UserId,
                u.username AS Username,
                COALESCE(u.display_name, u.username) AS DisplayName,
                COALESCE(e.ShareViews, 0) AS ShareViews,
                COALESCE(e.JoinClicks, 0) AS JoinClicks,
                COALESCE(r.ReferredSignups, 0) AS ReferredSignups
            FROM users u
            LEFT JOIN events e
                ON e.sharer_user_id = u.id
            LEFT JOIN referrals r
                ON r.referrer_user_id = u.id
            WHERE COALESCE(e.ShareViews, 0) > 0
               OR COALESCE(e.JoinClicks, 0) > 0
               OR COALESCE(r.ReferredSignups, 0) > 0
            ORDER BY COALESCE(r.ReferredSignups, 0) DESC,
                     COALESCE(e.JoinClicks, 0) DESC,
                     COALESCE(e.ShareViews, 0) DESC,
                     u.updated_at DESC
            LIMIT 8;
            """;

        const string boardPerformanceSql = """
            WITH event_rollup AS (
                SELECT
                    leaderboard_mode,
                    leaderboard_period,
                    SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END)::int AS ShareViews,
                    SUM(CASE WHEN event_type = 'cta-click' THEN 1 ELSE 0 END)::int AS JoinClicks
                FROM growth_share_events
                GROUP BY leaderboard_mode, leaderboard_period
            ),
            referral_rollup AS (
                SELECT
                    COALESCE(leaderboard_mode, 'combined') AS leaderboard_mode,
                    COALESCE(leaderboard_period, 'current') AS leaderboard_period,
                    COUNT(*)::int AS ReferredSignups
                FROM growth_referrals
                GROUP BY COALESCE(leaderboard_mode, 'combined'),
                         COALESCE(leaderboard_period, 'current')
            )
            SELECT
                COALESCE(e.leaderboard_mode, r.leaderboard_mode) AS LeaderboardMode,
                COALESCE(e.leaderboard_period, r.leaderboard_period) AS LeaderboardPeriod,
                COALESCE(e.ShareViews, 0) AS ShareViews,
                COALESCE(e.JoinClicks, 0) AS JoinClicks,
                COALESCE(r.ReferredSignups, 0) AS ReferredSignups
            FROM event_rollup e
            FULL OUTER JOIN referral_rollup r
                ON r.leaderboard_mode = e.leaderboard_mode
               AND r.leaderboard_period = e.leaderboard_period
            ORDER BY COALESCE(r.ReferredSignups, 0) DESC,
                     COALESCE(e.JoinClicks, 0) DESC,
                     COALESCE(e.ShareViews, 0) DESC;
            """;

        using var connection = _context.CreateConnection();
        var snapshot = await connection.QuerySingleAsync<AdminGrowthSnapshotResponse>(totalsSql);
        snapshot.TotalReferredSignups = await connection.ExecuteScalarAsync<int>(referralsSql);
        snapshot.TopSharers = (await connection.QueryAsync<GrowthTopSharerResponse>(topSharersSql)).ToList();
        snapshot.BoardPerformance =
            (await connection.QueryAsync<GrowthBoardPerformanceResponse>(boardPerformanceSql)).ToList();
        return snapshot;
    }
}
