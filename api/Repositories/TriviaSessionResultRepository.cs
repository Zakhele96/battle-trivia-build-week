using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaSessionResultRepository : ITriviaSessionResultRepository
{
    private readonly DapperContext _context;

    public TriviaSessionResultRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<bool> ExistsForSessionAsync(Guid sessionId)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM trivia_session_results
                WHERE session_id = @SessionId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { SessionId = sessionId });
    }

    public async Task CreateManyAsync(IEnumerable<TriviaSessionResult> rows)
    {
        const string sql = """
            INSERT INTO trivia_session_results (
                id,
                session_id,
                user_id,
                rank,
                score,
                created_at
            )
            VALUES (
                @Id,
                @SessionId,
                @UserId,
                @Rank,
                @Score,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, rows);
    }

    public async Task<IReadOnlyList<TriviaSessionResultRowDto>> GetBySessionIdAsync(Guid sessionId, int take = 10)
    {
        const string sql = """
            SELECT
                r.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                (COALESCE(u.is_supporter, FALSE) AND (u.supporter_expires_at IS NULL OR u.supporter_expires_at > NOW())) AS IsSupporter,
                CASE
                    WHEN LOWER(COALESCE(u.supporter_tier, '')) = 'supporter' THEN 'Supporter'
                    ELSE NULL
                END AS SupporterBadgeLabel,
                r.score AS Score,
                r.rank AS Rank
            FROM trivia_session_results r
            INNER JOIN users u
                ON u.id = r.user_id
            WHERE r.session_id = @SessionId
            ORDER BY r.rank ASC, r.score DESC, u.display_name ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<TriviaSessionResultRowDto>(sql, new
        {
            SessionId = sessionId,
            Take = take
        });

        return rows.ToList();
    }

    public async Task<TriviaSessionResultRowDto?> GetUserBySessionIdAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            SELECT
                r.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                (COALESCE(u.is_supporter, FALSE) AND (u.supporter_expires_at IS NULL OR u.supporter_expires_at > NOW())) AS IsSupporter,
                CASE
                    WHEN LOWER(COALESCE(u.supporter_tier, '')) = 'supporter' THEN 'Supporter'
                    ELSE NULL
                END AS SupporterBadgeLabel,
                r.score AS Score,
                r.rank AS Rank
            FROM trivia_session_results r
            INNER JOIN users u
                ON u.id = r.user_id
            WHERE r.session_id = @SessionId
              AND r.user_id = @UserId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaSessionResultRowDto>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }

    public async Task<IReadOnlyList<TriviaSessionResultRowDto>> GetLatestResultsAsync(int take = 3)
    {
        const string sql = """
            WITH latest_session AS (
                SELECT session_id
                FROM trivia_session_results
                GROUP BY session_id
                ORDER BY MAX(created_at) DESC
                LIMIT 1
            )
            SELECT
                r.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                (COALESCE(u.is_supporter, FALSE) AND (u.supporter_expires_at IS NULL OR u.supporter_expires_at > NOW())) AS IsSupporter,
                CASE
                    WHEN LOWER(COALESCE(u.supporter_tier, '')) = 'supporter' THEN 'Supporter'
                    ELSE NULL
                END AS SupporterBadgeLabel,
                r.score AS Score,
                r.rank AS Rank
            FROM trivia_session_results r
            INNER JOIN latest_session ls
                ON ls.session_id = r.session_id
            INNER JOIN users u
                ON u.id = r.user_id
            ORDER BY r.rank ASC, r.score DESC, u.display_name ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<TriviaSessionResultRowDto>(sql, new
        {
            Take = take
        });

        return rows.ToList();
    }
}
