using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;
using Microsoft.Extensions.Caching.Memory;

namespace Bts.Api.Repositories;

public sealed class TriviaQuestionRepository : ITriviaQuestionRepository
{
    private const string ActiveQuestionsCacheKey = "trivia-questions:active";
    private static readonly TimeSpan ActiveQuestionsCacheDuration = TimeSpan.FromMinutes(10);

    private readonly DapperContext _context;
    private readonly IMemoryCache _memoryCache;

    public TriviaQuestionRepository(DapperContext context, IMemoryCache memoryCache)
    {
        _context = context;
        _memoryCache = memoryCache;
    }

    public async Task<TriviaQuestion?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                question_text AS QuestionText,
                correct_answer AS CorrectAnswer,
                accepted_answers::text AS AcceptedAnswersJson,
                question_image_url AS QuestionImageUrl,
                answer_image_url AS AnswerImageUrl,
                answer_explanation AS AnswerExplanation,
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
        var activeQuestions = await GetActiveQuestionsAsync();
        if (activeQuestions.Count == 0)
            return null;

        if (excludeQuestionIds is null || excludeQuestionIds.Length == 0)
        {
            return activeQuestions[Random.Shared.Next(activeQuestions.Count)];
        }

        var excludedIds = excludeQuestionIds.ToHashSet();
        var filtered = activeQuestions
            .Where(question => !excludedIds.Contains(question.Id))
            .ToList();

        if (filtered.Count == 0)
        {
            return activeQuestions[Random.Shared.Next(activeQuestions.Count)];
        }

        return filtered[Random.Shared.Next(filtered.Count)];
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
                question_image_url AS QuestionImageUrl,
                answer_image_url AS AnswerImageUrl,
                answer_explanation AS AnswerExplanation,
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
                question_image_url,
                answer_image_url,
                answer_explanation,
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
                @QuestionImageUrl,
                @AnswerImageUrl,
                @AnswerExplanation,
                @Category,
                @Difficulty,
                @IsActive,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, question);
        InvalidateActiveQuestionCache();
    }

    public async Task UpdateAsync(TriviaQuestion question)
    {
        const string sql = """
            UPDATE trivia_questions
            SET question_text = @QuestionText,
                correct_answer = @CorrectAnswer,
                accepted_answers = CAST(@AcceptedAnswersJson AS jsonb),
                question_image_url = @QuestionImageUrl,
                answer_image_url = @AnswerImageUrl,
                answer_explanation = @AnswerExplanation,
                category = @Category,
                difficulty = @Difficulty,
                is_active = @IsActive
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, question);
        InvalidateActiveQuestionCache();
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
        InvalidateActiveQuestionCache();
    }

    public async Task<int> SetActiveByFilterAsync(
        bool isActive,
        string? category = null,
        string? difficulty = null,
        bool? currentIsActive = null)
    {
        const string sql = """
            UPDATE trivia_questions
            SET is_active = @IsActive
            WHERE (@Category IS NULL OR category = @Category)
              AND (@Difficulty IS NULL OR difficulty = @Difficulty)
              AND (@CurrentIsActive IS NULL OR is_active = @CurrentIsActive);
            """;

        using var connection = _context.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            IsActive = isActive,
            Category = category,
            Difficulty = difficulty,
            CurrentIsActive = currentIsActive
        });

        InvalidateActiveQuestionCache();
        return affected;
    }

    private async Task<IReadOnlyList<TriviaQuestion>> GetActiveQuestionsAsync()
    {
        var rows = await _memoryCache.GetOrCreateAsync(
            ActiveQuestionsCacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = ActiveQuestionsCacheDuration;

                const string sql = """
                    SELECT
                        id,
                        question_text AS QuestionText,
                        correct_answer AS CorrectAnswer,
                        accepted_answers::text AS AcceptedAnswersJson,
                        question_image_url AS QuestionImageUrl,
                        answer_image_url AS AnswerImageUrl,
                        answer_explanation AS AnswerExplanation,
                        category,
                        difficulty,
                        is_active AS IsActive,
                        created_at AS CreatedAt
                    FROM trivia_questions
                    WHERE is_active = TRUE
                    ORDER BY created_at DESC;
                    """;

                using var connection = _context.CreateConnection();
                var queryRows = await connection.QueryAsync<TriviaQuestion>(sql);
                return queryRows.ToList();
            });

        return rows ?? new List<TriviaQuestion>();
    }

    private void InvalidateActiveQuestionCache()
    {
        _memoryCache.Remove(ActiveQuestionsCacheKey);
    }
}
