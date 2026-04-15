using System.Data;
using System.Data.Common;
using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleAnswerRepository : IWordScrambleAnswerRepository
{
    private readonly DapperContext _context;

    public WordScrambleAnswerRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(WordScrambleAnswer answer)
    {
        const string sql = """
            INSERT INTO word_scramble_answers (
                id,
                round_id,
                user_id,
                submitted_answer,
                normalized_answer,
                is_correct,
                correct_rank,
                points_awarded,
                submitted_at
            )
            VALUES (
                @Id,
                @RoundId,
                @UserId,
                @SubmittedAnswer,
                @NormalizedAnswer,
                @IsCorrect,
                @CorrectRank,
                @PointsAwarded,
                @SubmittedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, answer);
    }

    public async Task CreateAsync(
        IDbConnection connection,
        WordScrambleAnswer answer,
        DbTransaction? transaction = null)
    {
        const string sql = """
            INSERT INTO word_scramble_answers (
                id,
                round_id,
                user_id,
                submitted_answer,
                normalized_answer,
                is_correct,
                correct_rank,
                points_awarded,
                submitted_at
            )
            VALUES (
                @Id,
                @RoundId,
                @UserId,
                @SubmittedAnswer,
                @NormalizedAnswer,
                @IsCorrect,
                @CorrectRank,
                @PointsAwarded,
                @SubmittedAt
            );
            """;

        await connection.ExecuteAsync(sql, answer, transaction);
    }

    public async Task<DateTime?> GetLatestSubmissionAtAsync(Guid roundId, Guid userId)
    {
        const string sql = """
            SELECT submitted_at
            FROM word_scramble_answers
            WHERE round_id = @RoundId
              AND user_id = @UserId
            ORDER BY submitted_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<DateTime?>(sql, new
        {
            RoundId = roundId,
            UserId = userId
        });
    }

    public async Task<int> GetWrongAttemptCountAsync(Guid roundId, Guid userId)
    {
        const string sql = """
            SELECT COUNT(*)::int
            FROM word_scramble_answers
            WHERE round_id = @RoundId
              AND user_id = @UserId
              AND is_correct = FALSE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            RoundId = roundId,
            UserId = userId
        });
    }

    public async Task<bool> HasUserCorrectAnswerAsync(
        IDbConnection connection,
        Guid roundId,
        Guid userId,
        DbTransaction? transaction = null)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM word_scramble_answers
                WHERE round_id = @RoundId
                  AND user_id = @UserId
                  AND is_correct = TRUE
            );
            """;

        return await connection.ExecuteScalarAsync<bool>(sql, new
        {
            RoundId = roundId,
            UserId = userId
        }, transaction);
    }

    public async Task<int> GetCorrectCountAsync(
        IDbConnection connection,
        Guid roundId,
        DbTransaction? transaction = null)
    {
        const string sql = """
            SELECT COUNT(*)::int
            FROM word_scramble_answers
            WHERE round_id = @RoundId
              AND is_correct = TRUE;
            """;

        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            RoundId = roundId
        }, transaction);
    }

    public async Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetRoundWinnersAsync(Guid roundId, int take = 5)
    {
        const string sql = """
            SELECT
                a.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                a.points_awarded AS Score,
                a.correct_rank AS Rank
            FROM word_scramble_answers a
            INNER JOIN users u
                ON u.id = a.user_id
            WHERE a.round_id = @RoundId
              AND a.is_correct = TRUE
            ORDER BY a.correct_rank ASC, a.submitted_at ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<WordScrambleLeaderboardRowDto>(sql, new
        {
            RoundId = roundId,
            Take = take
        });

        return rows.ToList();
    }
}