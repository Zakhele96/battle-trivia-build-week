using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaSessionRepository : ITriviaSessionRepository
{
    private readonly DapperContext _context;

    public TriviaSessionRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<TriviaGameSession?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                status,
                session_type AS SessionType,
                run_mode AS RunMode,
                started_at AS StartedAt,
                ended_at AS EndedAt,
                period_start AS PeriodStart,
                period_end AS PeriodEnd,
                winners_announced AS WinnersAnnounced
            FROM trivia_game_sessions
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaGameSession>(sql, new { Id = id });
    }

   public async Task<TriviaGameSession?> GetActiveByRoomIdAsync(Guid roomId)
{
    const string sql = """
        SELECT
            id,
            room_id AS RoomId,
            status,
            session_type AS SessionType,
            run_mode AS RunMode,
            started_at AS StartedAt,
            ended_at AS EndedAt,
            period_start AS PeriodStart,
            period_end AS PeriodEnd,
            winners_announced AS WinnersAnnounced
        FROM trivia_game_sessions
        WHERE room_id = @RoomId
          AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1;
        """;

    using var connection = _context.CreateConnection();
    return await connection.QuerySingleOrDefaultAsync<TriviaGameSession>(sql, new { RoomId = roomId });
}

    public async Task<TriviaGameSession?> GetLatestEndedByRoomIdAsync(Guid roomId)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                status,
                session_type AS SessionType,
                run_mode AS RunMode,
                started_at AS StartedAt,
                ended_at AS EndedAt,
                period_start AS PeriodStart,
                period_end AS PeriodEnd,
                winners_announced AS WinnersAnnounced
            FROM trivia_game_sessions
            WHERE room_id = @RoomId
              AND status = 'ended'
            ORDER BY ended_at DESC NULLS LAST, period_end DESC NULLS LAST
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaGameSession>(sql, new { RoomId = roomId });
    }

    public async Task<IReadOnlyList<TriviaGameSession>> GetRecentEndedByRoomIdAsync(Guid roomId, int take = 6)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                status,
                session_type AS SessionType,
                run_mode AS RunMode,
                started_at AS StartedAt,
                ended_at AS EndedAt,
                period_start AS PeriodStart,
                period_end AS PeriodEnd,
                winners_announced AS WinnersAnnounced
            FROM trivia_game_sessions
            WHERE room_id = @RoomId
              AND status = 'ended'
            ORDER BY ended_at DESC NULLS LAST, period_end DESC NULLS LAST
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<TriviaGameSession>(sql, new
        {
            RoomId = roomId,
            Take = take
        });

        return rows.ToList();
    }

    public async Task CreateAsync(TriviaGameSession session)
    {
        const string sql = """
            INSERT INTO trivia_game_sessions (
                id,
                room_id,
                status,
                session_type,
                run_mode,
                started_at,
                ended_at,
                period_start,
                period_end,
                winners_announced
            )
            VALUES (
                @Id,
                @RoomId,
                @Status,
                @SessionType,
                @RunMode,
                @StartedAt,
                @EndedAt,
                @PeriodStart,
                @PeriodEnd,
                @WinnersAnnounced
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, session);
    }

    public async Task EndAsync(Guid sessionId, DateTime endedAtUtc)
    {
        const string sql = """
            UPDATE trivia_game_sessions
            SET status = 'ended',
                ended_at = @EndedAtUtc
            WHERE id = @SessionId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            SessionId = sessionId,
            EndedAtUtc = endedAtUtc
        });
    }

    public async Task UpdateRunModeAsync(Guid sessionId, string runMode)
    {
        const string sql = """
            UPDATE trivia_game_sessions
            SET run_mode = @RunMode
            WHERE id = @SessionId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            SessionId = sessionId,
            RunMode = runMode
        });
    }

    public async Task<IReadOnlyList<Guid>> GetUserIdsBySessionIdAsync(Guid sessionId)
    {
        const string sql = """
        SELECT DISTINCT user_id
        FROM trivia_session_results
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
