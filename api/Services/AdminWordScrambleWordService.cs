using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminWordScrambleWordService
{
    private readonly IWordScrambleWordRepository _wordRepository;

    public AdminWordScrambleWordService(IWordScrambleWordRepository wordRepository)
    {
        _wordRepository = wordRepository;
    }

    public async Task<IEnumerable<WordScrambleWordResponse>> GetAllAsync(
        string? category,
        bool? isActive,
        int take)
    {
        var rows = await _wordRepository.GetAllAsync(category, isActive, take);
        return rows.Select(Map);
    }

    public async Task<WordScrambleWordResponse?> GetByIdAsync(Guid id)
    {
        var row = await _wordRepository.GetByIdAsync(id);
        return row is null ? null : Map(row);
    }

    public async Task<WordScrambleWordResponse> CreateAsync(CreateWordScrambleWordRequest request)
    {
        var normalized = NormalizeRequired(request.AnswerWord);
        var word = new WordScrambleWord
        {
            Id = Guid.NewGuid(),
            AnswerWord = request.AnswerWord.Trim(),
            NormalizedAnswer = normalized,
            Category = CleanOptional(request.Category),
            Hint = CleanOptional(request.Hint),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _wordRepository.CreateAsync(word);
        return Map(word);
    }

    public async Task<WordScrambleWordResponse?> UpdateAsync(Guid id, UpdateWordScrambleWordRequest request)
    {
        var existing = await _wordRepository.GetByIdAsync(id);
        if (existing is null) return null;

        existing.AnswerWord = request.AnswerWord.Trim();
        existing.NormalizedAnswer = NormalizeRequired(request.AnswerWord);
        existing.Category = CleanOptional(request.Category);
        existing.Hint = CleanOptional(request.Hint);
        existing.IsActive = request.IsActive;

        await _wordRepository.UpdateAsync(existing);
        return Map(existing);
    }

    public async Task<bool> SetActiveAsync(Guid id, bool isActive)
    {
        var existing = await _wordRepository.GetByIdAsync(id);
        if (existing is null) return false;

        await _wordRepository.SetActiveAsync(id, isActive);
        return true;
    }

    private static string NormalizeRequired(string value)
    {
        var normalized = WordScrambleTextNormalizer.Normalize(value);
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("Word is required.");

        return normalized;
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static WordScrambleWordResponse Map(WordScrambleWord word)
    {
        return new WordScrambleWordResponse
        {
            Id = word.Id,
            AnswerWord = word.AnswerWord,
            NormalizedAnswer = word.NormalizedAnswer,
            Category = word.Category,
            Hint = word.Hint,
            IsActive = word.IsActive,
            CreatedAt = word.CreatedAt
        };
    }
}
