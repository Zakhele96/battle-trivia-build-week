using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleRoundRepository : IWordScrambleRoundRepository
{
    private readonly DapperContext _context;

    public WordScrambleRoundRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<WordScrambleRound?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                round_number AS RoundNumber,
                answer_word AS AnswerWord,
                normalized_answer AS NormalizedAnswer,
                category,
                hint,
                initial_mask AS InitialMask,
                mask_at_20s AS MaskAt20s,
                mask_at_10s AS MaskAt10s,
                current_mask AS CurrentMask,
                status,
                starts_at AS StartsAt,
                ends_at AS EndsAt,
                revealed_at AS RevealedAt,
                created_at AS CreatedAt
            FROM word_scramble_rounds
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleRound>(sql, new { Id = id });
    }

    public async Task<WordScrambleRoundDetailsDto?> GetActiveRoundDetailsByRoomIdAsync(Guid roomId)
    {
        const string sql = """
            SELECT
                s.id AS SessionId,
                r.id AS RoundId,
                r.round_number AS RoundNumber,
                r.answer_word AS AnswerWord,
                r.normalized_answer AS NormalizedAnswer,
                r.category AS Category,
                r.hint AS Hint,
                r.initial_mask AS InitialMask,
                r.mask_at_20s AS MaskAt20s,
                r.mask_at_10s AS MaskAt10s,
                r.current_mask AS CurrentMask,
                r.status AS Status,
                r.starts_at AS StartsAt,
                r.ends_at AS EndsAt,
                r.revealed_at AS RevealedAt
            FROM word_scramble_rounds r
            INNER JOIN word_scramble_sessions s
                ON s.id = r.session_id
            WHERE s.room_id = @RoomId
              AND s.status = 'active'
              AND r.status = 'active'
            ORDER BY r.starts_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleRoundDetailsDto>(sql, new
        {
            RoomId = roomId
        });
    }

    public async Task<WordScrambleRound?> GetLatestBySessionIdAsync(Guid sessionId)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                round_number AS RoundNumber,
                answer_word AS AnswerWord,
                normalized_answer AS NormalizedAnswer,
                category,
                hint,
                initial_mask AS InitialMask,
                mask_at_20s AS MaskAt20s,
                mask_at_10s AS MaskAt10s,
                current_mask AS CurrentMask,
                status,
                starts_at AS StartsAt,
                ends_at AS EndsAt,
                revealed_at AS RevealedAt,
                created_at AS CreatedAt
            FROM word_scramble_rounds
            WHERE session_id = @SessionId
            ORDER BY round_number DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleRound>(sql, new
        {
            SessionId = sessionId
        });
    }

    public async Task CreateAsync(WordScrambleRound round)
    {
        const string sql = """
            INSERT INTO word_scramble_rounds (
                id,
                session_id,
                round_number,
                answer_word,
                normalized_answer,
                category,
                hint,
                initial_mask,
                mask_at_20s,
                mask_at_10s,
                current_mask,
                status,
                starts_at,
                ends_at,
                revealed_at,
                created_at
            )
            VALUES (
                @Id,
                @SessionId,
                @RoundNumber,
                @AnswerWord,
                @NormalizedAnswer,
                @Category,
                @Hint,
                @InitialMask,
                @MaskAt20s,
                @MaskAt10s,
                @CurrentMask,
                @Status,
                @StartsAt,
                @EndsAt,
                @RevealedAt,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, round);
    }

    public async Task UpdateCurrentMaskAsync(Guid roundId, string currentMask)
    {
        const string sql = """
            UPDATE word_scramble_rounds
            SET current_mask = @CurrentMask
            WHERE id = @RoundId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoundId = roundId,
            CurrentMask = currentMask
        });
    }

    public async Task RevealAsync(Guid roundId, string finalMask, DateTime revealedAtUtc)
    {
        const string sql = """
            UPDATE word_scramble_rounds
            SET current_mask = @FinalMask,
                status = 'revealed',
                revealed_at = @RevealedAtUtc
            WHERE id = @RoundId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoundId = roundId,
            FinalMask = finalMask,
            RevealedAtUtc = revealedAtUtc
        });
    }

    public async Task CloseAsync(Guid roundId)
    {
        const string sql = """
            UPDATE word_scramble_rounds
            SET status = 'closed'
            WHERE id = @RoundId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { RoundId = roundId });
    }
}