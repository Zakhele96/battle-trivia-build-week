using Bts.Api.Data;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaLeaderboardRepository : ITriviaLeaderboardRepository
{
    private readonly DapperContext _context;

    public TriviaLeaderboardRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TriviaLeaderboardEntryDto>> GetSessionLeaderboardAsync(Guid sessionId, int take = 5)
    {
        const string sql = """
            WITH leaderboard AS (
                SELECT
                    tsl.user_id AS UserId,
                    u.username AS Username,
                    u.display_name AS DisplayName,
                    u.avatar_url AS AvatarUrl,
                    (COALESCE(u.is_supporter, FALSE) AND (u.supporter_expires_at IS NULL OR u.supporter_expires_at > NOW())) AS IsSupporter,
                    CASE
                        WHEN LOWER(COALESCE(u.supporter_tier, '')) = 'supporter' THEN 'Supporter'
                        ELSE NULL
                    END AS SupporterBadgeLabel,
                    SUM(tsl.points) AS Score
                FROM trivia_score_ledger tsl
                INNER JOIN users u
                    ON u.id = tsl.user_id
                WHERE tsl.session_id = @SessionId
                GROUP BY
                    tsl.user_id,
                    u.username,
                    u.display_name
                    ,
                    u.avatar_url,
                    u.is_supporter,
                    u.supporter_tier,
                    u.supporter_expires_at
            )
            SELECT
                UserId,
                Username,
                DisplayName,
                AvatarUrl,
                IsSupporter,
                SupporterBadgeLabel,
                Score,
                DENSE_RANK() OVER (ORDER BY Score DESC) AS Rank
            FROM leaderboard
            ORDER BY Score DESC, DisplayName ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();

        return await connection.QueryAsync<TriviaLeaderboardEntryDto>(sql, new
        {
            SessionId = sessionId,
            Take = take
        });
    }

    public async Task<TriviaPlayerRankDto?> GetPlayerRankAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            WITH leaderboard AS (
                SELECT
                    tsl.user_id AS UserId,
                    u.username AS Username,
                    u.display_name AS DisplayName,
                    SUM(tsl.points) AS Score
                FROM trivia_score_ledger tsl
                INNER JOIN users u
                    ON u.id = tsl.user_id
                WHERE tsl.session_id = @SessionId
                GROUP BY
                    tsl.user_id,
                    u.username,
                    u.display_name
            ),
            ranked AS (
                SELECT
                    UserId,
                    Username,
                    DisplayName,
                    Score,
                    DENSE_RANK() OVER (ORDER BY Score DESC) AS Rank
                FROM leaderboard
            )
            SELECT
                UserId,
                Username,
                DisplayName,
                Score,
                Rank
            FROM ranked
            WHERE UserId = @UserId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();

        return await connection.QuerySingleOrDefaultAsync<TriviaPlayerRankDto>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }
}
