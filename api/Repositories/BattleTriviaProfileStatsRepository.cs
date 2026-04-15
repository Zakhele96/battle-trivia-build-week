using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class BattleTriviaProfileStatsRepository : IBattleTriviaProfileStatsRepository
{
    private readonly DapperContext _context;

    public BattleTriviaProfileStatsRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<int> GetTotalCorrectAnswersAsync(Guid userId)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM trivia_answers a
            INNER JOIN trivia_rounds r
                ON r.id = a.round_id
            INNER JOIN trivia_game_sessions s
                ON s.id = r.session_id
            INNER JOIN rooms ro
                ON ro.id = s.room_id
            WHERE a.user_id = @UserId
              AND a.is_correct = TRUE
              AND ro.slug = 'battle-trivia';
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId });
    }

    public async Task<int> GetWeeklyWinsAsync(Guid userId)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM trivia_session_results r
            INNER JOIN trivia_game_sessions s
                ON s.id = r.session_id
            INNER JOIN rooms ro
                ON ro.id = s.room_id
            WHERE r.user_id = @UserId
              AND r.rank = 1
              AND ro.slug = 'battle-trivia';
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId });
    }

    public async Task<int?> GetFastestCorrectAnswerMsAsync(Guid userId)
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
            INNER JOIN trivia_game_sessions s
                ON s.id = r.session_id
            INNER JOIN rooms ro
                ON ro.id = s.room_id
            WHERE a.user_id = @UserId
              AND a.is_correct = TRUE
              AND ro.slug = 'battle-trivia';
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new { UserId = userId });
    }

    public async Task<int> GetBestStreakAsync(Guid userId)
    {
        const string sql = """
            WITH ordered_rounds AS (
                SELECT
                    r.id AS round_id,
                    COALESCE(s.period_start, s.started_at, r.started_at, r.created_at) AS session_sort_at,
                    r.round_number AS round_number,
                    EXISTS (
                        SELECT 1
                        FROM trivia_answers a
                        WHERE a.round_id = r.id
                          AND a.user_id = @UserId
                          AND a.is_correct = TRUE
                    ) AS was_correct
                FROM trivia_rounds r
                INNER JOIN trivia_game_sessions s
                    ON s.id = r.session_id
                INNER JOIN rooms ro
                    ON ro.id = s.room_id
                WHERE ro.slug = 'battle-trivia'
                ORDER BY
                    COALESCE(s.period_start, s.started_at, r.started_at, r.created_at),
                    r.round_number,
                    r.id
            ),
            marked AS (
                SELECT
                    *,
                    SUM(CASE WHEN was_correct THEN 0 ELSE 1 END)
                        OVER (ORDER BY session_sort_at, round_number, round_id) AS grp
                FROM ordered_rounds
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
        return await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId });
    }

    public async Task<int?> GetCurrentWeeklyRankAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            WITH ranked AS (
                SELECT
                    a.user_id AS user_id,
                    RANK() OVER (
                        ORDER BY
                            COALESCE(SUM(a.points_awarded), 0) DESC,
                            MIN(a.submitted_at) ASC,
                            a.user_id ASC
                    ) AS rank
                FROM trivia_answers a
                INNER JOIN trivia_rounds r
                    ON r.id = a.round_id
                WHERE r.session_id = @SessionId
                  AND a.is_correct = TRUE
                GROUP BY a.user_id
            )
            SELECT rank
            FROM ranked
            WHERE user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }
}