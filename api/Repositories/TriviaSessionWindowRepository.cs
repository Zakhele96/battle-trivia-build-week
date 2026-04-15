using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaSessionWindowRepository : ITriviaSessionWindowRepository
{
    private readonly DapperContext _context;

    public TriviaSessionWindowRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TriviaSessionWindow>> GetActiveBySessionIdAsync(Guid sessionId)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                day_of_week AS DayOfWeek,
                start_time AS StartTime,
                end_time AS EndTime,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM trivia_session_windows
            WHERE session_id = @SessionId
              AND is_active = TRUE
            ORDER BY day_of_week, start_time;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<TriviaSessionWindow>(sql, new { SessionId = sessionId });
        return rows.ToList();
    }

    public async Task ReplaceAsync(Guid sessionId, IEnumerable<TriviaSessionWindow> windows)
    {
        using var connection = _context.CreateConnection();
        connection.Open();

        using var transaction = connection.BeginTransaction();

        const string deleteSql = """
            DELETE FROM trivia_session_windows
            WHERE session_id = @SessionId;
            """;

        await connection.ExecuteAsync(deleteSql, new { SessionId = sessionId }, transaction);

        const string insertSql = """
            INSERT INTO trivia_session_windows (
                id,
                session_id,
                day_of_week,
                start_time,
                end_time,
                is_active,
                created_at
            )
            VALUES (
                @Id,
                @SessionId,
                @DayOfWeek,
                @StartTime,
                @EndTime,
                @IsActive,
                @CreatedAt
            );
            """;

        var rows = windows
            .Select(x => new
            {
                x.Id,
                x.SessionId,
                x.DayOfWeek,
                StartTime = x.StartTime.ToTimeSpan(),
                EndTime = x.EndTime.ToTimeSpan(),
                x.IsActive,
                x.CreatedAt
            })
            .ToList();

        if (rows.Count > 0)
        {
            await connection.ExecuteAsync(insertSql, rows, transaction);
        }

        transaction.Commit();
    }
}