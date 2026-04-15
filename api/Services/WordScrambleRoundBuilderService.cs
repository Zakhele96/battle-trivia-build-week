using Bts.Api.Models.Domain;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class WordScrambleRoundBuilderService
{
    private readonly IWordScrambleWordRepository _wordRepository;
    private readonly IWordScrambleRoundRepository _roundRepository;
    private readonly WordScrambleMaskService _maskService;

    public WordScrambleRoundBuilderService(
        IWordScrambleWordRepository wordRepository,
        IWordScrambleRoundRepository roundRepository,
        WordScrambleMaskService maskService)
    {
        _wordRepository = wordRepository;
        _roundRepository = roundRepository;
        _maskService = maskService;
    }

    public async Task<WordScrambleRound> BuildNextRoundAsync(
        Guid sessionId,
        DateTime startsAtUtc,
        int durationSeconds = 30,
        string? category = null)
    {
        var latestRound = await _roundRepository.GetLatestBySessionIdAsync(sessionId);
        var nextRoundNumber = latestRound is null ? 1 : latestRound.RoundNumber + 1;

        var word = await _wordRepository.GetRandomActiveAsync(category);
        if (word is null)
            throw new InvalidOperationException("No active word scramble words are available.");

        var normalizedAnswer = string.IsNullOrWhiteSpace(word.NormalizedAnswer)
            ? WordScrambleTextNormalizer.Normalize(word.AnswerWord)
            : word.NormalizedAnswer;

        var masks = _maskService.BuildMasks(word.AnswerWord);

        return new WordScrambleRound
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            RoundNumber = nextRoundNumber,
            AnswerWord = word.AnswerWord,
            NormalizedAnswer = normalizedAnswer,
            Category = word.Category,
            Hint = word.Hint,
            InitialMask = masks.InitialMask,
            MaskAt20s = masks.MaskAt20s,
            MaskAt10s = masks.MaskAt10s,
            CurrentMask = masks.InitialMask,
            Status = "active",
            StartsAt = startsAtUtc,
            EndsAt = startsAtUtc.AddSeconds(durationSeconds),
            RevealedAt = null,
            CreatedAt = DateTime.UtcNow
        };
    }
}