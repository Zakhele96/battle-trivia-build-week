using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleWordRepository : IWordScrambleWordRepository
{
    private readonly DapperContext _context;

    public WordScrambleWordRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<WordScrambleWord?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                answer_word AS AnswerWord,
                normalized_answer AS NormalizedAnswer,
                category,
                hint,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM word_scramble_words
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleWord>(sql, new { Id = id });
    }

    public async Task<WordScrambleWord?> GetRandomActiveAsync(string? category = null)
    {
        const string sql = """
            SELECT
                id,
                answer_word AS AnswerWord,
                normalized_answer AS NormalizedAnswer,
                category,
                hint,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM word_scramble_words
            WHERE is_active = TRUE
              AND (@Category IS NULL OR category = @Category)
            ORDER BY RANDOM()
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<WordScrambleWord>(sql, new
        {
            Category = category
        });
    }

    public async Task<IReadOnlyList<WordScrambleWord>> GetActiveAsync(int take = 100)
    {
        const string sql = """
            SELECT
                id,
                answer_word AS AnswerWord,
                normalized_answer AS NormalizedAnswer,
                category,
                hint,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM word_scramble_words
            WHERE is_active = TRUE
            ORDER BY created_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<WordScrambleWord>(sql, new
        {
            Take = take
        });

        return rows.ToList();
    }

    public async Task CreateAsync(WordScrambleWord word)
    {
        const string sql = """
            INSERT INTO word_scramble_words (
                id,
                answer_word,
                normalized_answer,
                category,
                hint,
                is_active,
                created_at
            )
            VALUES (
                @Id,
                @AnswerWord,
                @NormalizedAnswer,
                @Category,
                @Hint,
                @IsActive,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, word);
    }
}