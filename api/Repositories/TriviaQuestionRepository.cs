using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaQuestionRepository : ITriviaQuestionRepository
{
    private readonly DapperContext _context;

    public TriviaQuestionRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<TriviaQuestion?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                question_text AS QuestionText,
                correct_answer AS CorrectAnswer,
                accepted_answers::text AS AcceptedAnswersJson,
                category,
                difficulty,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM trivia_questions
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<TriviaQuestion>(sql, new { Id = id });
    }

    public async Task<TriviaQuestion?> GetRandomActiveAsync(Guid[]? excludeQuestionIds = null)
    {
        using var connection = _context.CreateConnection();

        const string baseSql = """
            SELECT
                id,
                question_text AS QuestionText,
                correct_answer AS CorrectAnswer,
                accepted_answers::text AS AcceptedAnswersJson,
                category,
                difficulty,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM trivia_questions
            WHERE is_active = TRUE
            ORDER BY RANDOM()
            LIMIT 1;
            """;

        if (excludeQuestionIds is null || excludeQuestionIds.Length == 0)
        {
            return await connection.QuerySingleOrDefaultAsync<TriviaQuestion>(baseSql);
        }

        const string exclusionSql = """
            SELECT
                id,
                question_text AS QuestionText,
                correct_answer AS CorrectAnswer,
                accepted_answers::text AS AcceptedAnswersJson,
                category,
                difficulty,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM trivia_questions
            WHERE is_active = TRUE
              AND NOT (id = ANY(@ExcludeQuestionIds))
            ORDER BY RANDOM()
            LIMIT 1;
            """;

        var question = await connection.QuerySingleOrDefaultAsync<TriviaQuestion>(
            exclusionSql,
            new { ExcludeQuestionIds = excludeQuestionIds });

        if (question is not null)
            return question;

        return await connection.QuerySingleOrDefaultAsync<TriviaQuestion>(baseSql);
    }

    public async Task<IEnumerable<TriviaQuestion>> GetAllAsync(
        string? category = null,
        string? difficulty = null,
        bool? isActive = null)
    {
        const string sql = """
            SELECT
                id,
                question_text AS QuestionText,
                correct_answer AS CorrectAnswer,
                accepted_answers::text AS AcceptedAnswersJson,
                category,
                difficulty,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM trivia_questions
            WHERE (@Category IS NULL OR category = @Category)
              AND (@Difficulty IS NULL OR difficulty = @Difficulty)
              AND (@IsActive IS NULL OR is_active = @IsActive)
            ORDER BY created_at DESC;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QueryAsync<TriviaQuestion>(sql, new
        {
            Category = category,
            Difficulty = difficulty,
            IsActive = isActive
        });
    }

    public async Task CreateAsync(TriviaQuestion question)
    {
        const string sql = """
            INSERT INTO trivia_questions (
                id,
                question_text,
                correct_answer,
                accepted_answers,
                category,
                difficulty,
                is_active,
                created_at
            )
            VALUES (
                @Id,
                @QuestionText,
                @CorrectAnswer,
                CAST(@AcceptedAnswersJson AS jsonb),
                @Category,
                @Difficulty,
                @IsActive,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, question);
    }

    public async Task UpdateAsync(TriviaQuestion question)
    {
        const string sql = """
            UPDATE trivia_questions
            SET question_text = @QuestionText,
                correct_answer = @CorrectAnswer,
                accepted_answers = CAST(@AcceptedAnswersJson AS jsonb),
                category = @Category,
                difficulty = @Difficulty,
                is_active = @IsActive
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, question);
    }

    public async Task SetActiveAsync(Guid id, bool isActive)
    {
        const string sql = """
            UPDATE trivia_questions
            SET is_active = @IsActive
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { Id = id, IsActive = isActive });
    }
}