using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class BattleTriviaSessionSummaryRepository : IBattleTriviaSessionSummaryRepository
{
    private readonly DapperContext _context;

    public BattleTriviaSessionSummaryRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<int> GetCorrectCountAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM trivia_answers a
            INNER JOIN trivia_rounds r
                ON r.id = a.round_id
            WHERE r.session_id = @SessionId
              AND a.user_id = @UserId
              AND a.is_correct = TRUE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }

    public async Task<int?> GetFastestCorrectAnswerMsAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            SELECT MIN(
                GREATEST(
                    0,
                    (EXTRACT(EPOCH FROM (a.submitted_at - r.started_at)) * 1000)::int
                )
            )
            FROM trivia_answers a
            INNER JOIN trivia_rounds r
                ON r.id = a.round_id
            WHERE r.session_id = @SessionId
              AND a.user_id = @UserId
              AND a.is_correct = TRUE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }

    public async Task<int> GetBestStreakAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            WITH session_rounds AS (
                SELECT
                    r.id AS round_id,
                    r.round_number AS round_number,
                    EXISTS (
                        SELECT 1
                        FROM trivia_answers a
                        WHERE a.round_id = r.id
                          AND a.user_id = @UserId
                          AND a.is_correct = TRUE
                    ) AS was_correct
                FROM trivia_rounds r
                WHERE r.session_id = @SessionId
                ORDER BY r.round_number, r.id
            ),
            marked AS (
                SELECT
                    *,
                    SUM(CASE WHEN was_correct THEN 0 ELSE 1 END)
                        OVER (ORDER BY round_number, round_id) AS grp
                FROM session_rounds
            ),
            streaks AS (
                SELECT grp, COUNT(*)::int AS streak_len
                FROM marked
                WHERE was_correct = TRUE
                GROUP BY grp
            )
            SELECT COALESCE(MAX(streak_len), 0)
            FROM streaks;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }
}