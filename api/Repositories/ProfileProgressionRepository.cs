using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class ProfileProgressionRepository : IProfileProgressionRepository
{
    private readonly DapperContext _context;

    public ProfileProgressionRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<ProfileProgressionSnapshot> GetSnapshotAsync(Guid userId)
    {
        const string sql = """
            WITH completed_sessions AS (
                SELECT
                    r.rank,
                    r.score,
                    COALESCE(s.ended_at, s.period_end, s.started_at) AS ended_at
                FROM trivia_session_results r
                INNER JOIN trivia_game_sessions s
                    ON s.id = r.session_id
                INNER JOIN rooms ro
                    ON ro.id = s.room_id
                WHERE r.user_id = @UserId
                  AND ro.slug = 'battle-trivia'
                  AND s.status = 'ended'
            ),
            correct_stats AS (
                SELECT
                    COUNT(*)::int AS total_correct_answers,
                    MIN(
                        GREATEST(
                            0,
                            (EXTRACT(EPOCH FROM (a.submitted_at - r.started_at)) * 1000)::int
                        )
                    ) AS fastest_correct_answer_ms
                FROM trivia_answers a
                INNER JOIN trivia_rounds r
                    ON r.id = a.round_id
                INNER JOIN trivia_game_sessions s
                    ON s.id = r.session_id
                INNER JOIN rooms ro
                    ON ro.id = s.room_id
                WHERE a.user_id = @UserId
                  AND a.is_correct = TRUE
                  AND ro.slug = 'battle-trivia'
            ),
            streak_groups AS (
                SELECT
                    rr.round_number,
                    EXISTS (
                        SELECT 1
                        FROM trivia_answers a
                        WHERE a.round_id = rr.id
                          AND a.user_id = @UserId
                          AND a.is_correct = TRUE
                    ) AS was_correct,
                    rr.session_id
                FROM trivia_rounds rr
                INNER JOIN trivia_game_sessions s
                    ON s.id = rr.session_id
                INNER JOIN rooms ro
                    ON ro.id = s.room_id
                WHERE ro.slug = 'battle-trivia'
            ),
            streak_marked AS (
                SELECT
                    *,
                    SUM(CASE WHEN was_correct THEN 0 ELSE 1 END)
                        OVER (PARTITION BY session_id ORDER BY round_number) AS grp
                FROM streak_groups
            ),
            best_streaks AS (
                SELECT COALESCE(MAX(streak_len), 0)::int AS best_streak
                FROM (
                    SELECT COUNT(*)::int AS streak_len
                    FROM streak_marked
                    WHERE was_correct = TRUE
                    GROUP BY session_id, grp
                ) s
            )
            SELECT
                COALESCE((SELECT total_correct_answers FROM correct_stats), 0) AS TotalCorrectAnswers,
                COALESCE((SELECT best_streak FROM best_streaks), 0) AS BestStreak,
                COALESCE((SELECT COUNT(*)::int FROM completed_sessions WHERE rank = 1), 0) AS WeeklyWins,
                (SELECT fastest_correct_answer_ms FROM correct_stats) AS FastestCorrectAnswerMs,
                COALESCE((SELECT COUNT(*)::int FROM completed_sessions), 0) AS SessionsPlayed,
                (SELECT MIN(rank) FROM completed_sessions) AS BestRank;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleAsync<ProfileProgressionSnapshot>(sql, new
        {
            UserId = userId
        });
    }
}