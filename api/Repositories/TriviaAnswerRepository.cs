using System.Data;
using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaAnswerRepository : ITriviaAnswerRepository
{
    private readonly DapperContext _context;

    public TriviaAnswerRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(
        IDbConnection connection,
        TriviaAnswer answer,
        IDbTransaction? transaction = null)
    {
        const string sql = """
            INSERT INTO trivia_answers (
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

    public async Task<bool> HasUserCorrectAnswerAsync(
        IDbConnection connection,
        Guid roundId,
        Guid userId,
        IDbTransaction? transaction = null)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM trivia_answers
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
        IDbTransaction? transaction = null)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM trivia_answers
            WHERE round_id = @RoundId
              AND is_correct = TRUE;
            """;

        return await connection.ExecuteScalarAsync<int>(sql, new { RoundId = roundId }, transaction);
    }

    public async Task<int> GetWrongAttemptCountAsync(Guid roundId, Guid userId)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM trivia_answers
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

    public async Task<DateTime?> GetLatestSubmissionAtAsync(Guid roundId, Guid userId)
    {
        const string sql = """
            SELECT MAX(submitted_at)
            FROM trivia_answers
            WHERE round_id = @RoundId
              AND user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<DateTime?>(sql, new
        {
            RoundId = roundId,
            UserId = userId
        });
    }

    public async Task<IEnumerable<TriviaCorrectAnswerResult>> GetCorrectResultsByRoundAsync(Guid roundId)
    {
        const string sql = """
            SELECT
                a.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                a.submitted_answer AS SubmittedAnswer,
                a.correct_rank AS CorrectRank,
                a.points_awarded AS PointsAwarded,
                a.submitted_at AS SubmittedAt
            FROM trivia_answers a
            INNER JOIN users u
                ON u.id = a.user_id
            WHERE a.round_id = @RoundId
              AND a.is_correct = TRUE
            ORDER BY a.correct_rank ASC, a.submitted_at ASC;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QueryAsync<TriviaCorrectAnswerResult>(sql, new { RoundId = roundId });
    }
}