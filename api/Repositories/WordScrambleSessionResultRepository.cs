using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleSessionResultRepository : IWordScrambleSessionResultRepository
{
    private readonly DapperContext _context;

    public WordScrambleSessionResultRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<bool> ExistsForSessionAsync(Guid sessionId)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM word_scramble_session_results
                WHERE session_id = @SessionId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { SessionId = sessionId });
    }

    public async Task CreateManyAsync(IEnumerable<WordScrambleSessionResult> rows)
    {
        const string sql = """
            INSERT INTO word_scramble_session_results (
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

    public async Task<IReadOnlyList<WordScrambleSessionResultRowDto>> GetBySessionIdAsync(Guid sessionId, int take = 10)
    {
        const string sql = """
            SELECT
                r.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                r.score AS Score,
                r.rank AS Rank
            FROM word_scramble_session_results r
            INNER JOIN users u
                ON u.id = r.user_id
            WHERE r.session_id = @SessionId
            ORDER BY r.rank ASC, r.score DESC, u.display_name ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<WordScrambleSessionResultRowDto>(sql, new
        {
            SessionId = sessionId,
            Take = take
        });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<Guid>> GetUserIdsBySessionIdAsync(Guid sessionId)
    {
        const string sql = """
            SELECT DISTINCT user_id
            FROM word_scramble_session_results
            WHERE session_id = @SessionId
            ORDER BY user_id;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<Guid>(sql, new
        {
            SessionId = sessionId
        });

        return rows.ToList();
    }
}