using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleSessionRepository : IWordScrambleSessionRepository
{
    private readonly DapperContext _context;

    public WordScrambleSessionRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<WordScrambleSession?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                status,
                run_mode AS RunMode,
                started_at AS StartedAt,
                ended_at AS EndedAt,
                period_start AS PeriodStart,
                period_end AS PeriodEnd,
                created_at AS CreatedAt
            FROM word_scramble_sessions
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleSession>(sql, new { Id = id });
    }

    public async Task<WordScrambleSession?> GetActiveByRoomIdAsync(Guid roomId)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                status,
                run_mode AS RunMode,
                started_at AS StartedAt,
                ended_at AS EndedAt,
                period_start AS PeriodStart,
                period_end AS PeriodEnd,
                created_at AS CreatedAt
            FROM word_scramble_sessions
            WHERE room_id = @RoomId
              AND status = 'active'
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleSession>(sql, new { RoomId = roomId });
    }

    public async Task CreateAsync(WordScrambleSession session)
    {
        const string sql = """
            INSERT INTO word_scramble_sessions (
                id,
                room_id,
                status,
                run_mode,
                started_at,
                ended_at,
                period_start,
                period_end,
                created_at
            )
            VALUES (
                @Id,
                @RoomId,
                @Status,
                @RunMode,
                @StartedAt,
                @EndedAt,
                @PeriodStart,
                @PeriodEnd,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, session);
    }

    public async Task EndAsync(Guid sessionId, DateTime endedAtUtc)
    {
        const string sql = """
            UPDATE word_scramble_sessions
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
            UPDATE word_scramble_sessions
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

    public async Task<WordScrambleSession?> GetLatestEndedByRoomIdAsync(Guid roomId)
    {
        const string sql = """
        SELECT
            id,
            room_id AS RoomId,
            status,
            run_mode AS RunMode,
            started_at AS StartedAt,
            ended_at AS EndedAt,
            period_start AS PeriodStart,
            period_end AS PeriodEnd,
            created_at AS CreatedAt
        FROM word_scramble_sessions
        WHERE room_id = @RoomId
          AND status = 'ended'
        ORDER BY ended_at DESC NULLS LAST
        LIMIT 1;
        """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleSession>(sql, new
        {
            RoomId = roomId
        });
    }
}