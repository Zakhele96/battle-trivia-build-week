using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaRoundRepository : ITriviaRoundRepository
{
    private readonly DapperContext _context;

    public TriviaRoundRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<TriviaRound?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                question_id AS QuestionId,
                round_number AS RoundNumber,
                status,
                started_at AS StartedAt,
                ends_at AS EndsAt,
                created_at AS CreatedAt
            FROM trivia_rounds
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaRound>(sql, new { Id = id });
    }

    public async Task<TriviaRound?> GetActiveBySessionIdAsync(Guid sessionId)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                question_id AS QuestionId,
                round_number AS RoundNumber,
                status,
                started_at AS StartedAt,
                ends_at AS EndsAt,
                created_at AS CreatedAt
            FROM trivia_rounds
            WHERE session_id = @SessionId
              AND status = 'active'
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaRound>(sql, new { SessionId = sessionId });
    }

    public async Task<TriviaRound?> GetLatestBySessionIdAsync(Guid sessionId)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                question_id AS QuestionId,
                round_number AS RoundNumber,
                status,
                started_at AS StartedAt,
                ends_at AS EndsAt,
                created_at AS CreatedAt
            FROM trivia_rounds
            WHERE session_id = @SessionId
            ORDER BY round_number DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaRound>(sql, new { SessionId = sessionId });
    }

    public async Task<int> GetLatestRoundNumberAsync(Guid sessionId)
    {
        const string sql = """
            SELECT COALESCE(MAX(round_number), 0)
            FROM trivia_rounds
            WHERE session_id = @SessionId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { SessionId = sessionId });
    }

    public async Task<TriviaRoundDetails?> GetActiveRoundDetailsByRoomIdAsync(Guid roomId)
    {
        const string sql = """
            SELECT
                r.id AS RoundId,
                r.session_id AS SessionId,
                r.question_id AS QuestionId,
                r.round_number AS RoundNumber,
                r.status AS Status,
                r.started_at AS StartedAt,
                r.ends_at AS EndsAt,
                q.question_text AS QuestionText,
                q.correct_answer AS CorrectAnswer,
                q.accepted_answers::text AS AcceptedAnswersJson
            FROM trivia_rounds r
            INNER JOIN trivia_game_sessions s
                ON s.id = r.session_id
            INNER JOIN trivia_questions q
                ON q.id = r.question_id
            WHERE s.room_id = @RoomId
              AND s.status = 'active'
              AND r.status = 'active'
            ORDER BY r.round_number DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaRoundDetails>(sql, new { RoomId = roomId });
    }

    public async Task CreateAsync(TriviaRound round)
    {
        const string sql = """
            INSERT INTO trivia_rounds (
                id,
                session_id,
                question_id,
                round_number,
                status,
                started_at,
                ends_at,
                created_at
            )
            VALUES (
                @Id,
                @SessionId,
                @QuestionId,
                @RoundNumber,
                @Status,
                @StartedAt,
                @EndsAt,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, round);
    }

    public async Task SetStatusAsync(Guid roundId, string status)
    {
        const string sql = """
            UPDATE trivia_rounds
            SET status = @Status
            WHERE id = @RoundId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoundId = roundId,
            Status = status
        });
    }
}