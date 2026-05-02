using System.Text.Json;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminTriviaQuestionService
{
    private readonly ITriviaQuestionRepository _triviaQuestionRepository;

    public AdminTriviaQuestionService(ITriviaQuestionRepository triviaQuestionRepository)
    {
        _triviaQuestionRepository = triviaQuestionRepository;
    }

    public async Task<IEnumerable<TriviaQuestionResponse>> GetAllAsync(
        string? category,
        string? difficulty,
        bool? isActive)
    {
        var rows = await _triviaQuestionRepository.GetAllAsync(category, difficulty, isActive);
        return rows.Select(Map);
    }

    public async Task<TriviaQuestionResponse?> GetByIdAsync(Guid id)
    {
        var row = await _triviaQuestionRepository.GetByIdAsync(id);
        return row is null ? null : Map(row);
    }

    public async Task<TriviaQuestionResponse> CreateAsync(CreateTriviaQuestionRequest request)
    {
        var question = new TriviaQuestion
        {
            Id = Guid.NewGuid(),
            QuestionText = request.QuestionText.Trim(),
            CorrectAnswer = request.CorrectAnswer.Trim(),
            AcceptedAnswersJson = BuildAcceptedAnswersJson(request.CorrectAnswer, request.AcceptedAnswers),
            Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim(),
            Difficulty = string.IsNullOrWhiteSpace(request.Difficulty) ? null : request.Difficulty.Trim(),
            QuestionImageUrl = CleanOptional(request.QuestionImageUrl),
            AnswerImageUrl = CleanOptional(request.AnswerImageUrl),
            AnswerExplanation = CleanOptional(request.AnswerExplanation),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _triviaQuestionRepository.CreateAsync(question);
        return Map(question);
    }

    public async Task<TriviaQuestionResponse?> UpdateAsync(Guid id, UpdateTriviaQuestionRequest request)
    {
        var existing = await _triviaQuestionRepository.GetByIdAsync(id);
        if (existing is null) return null;

        existing.QuestionText = request.QuestionText.Trim();
        existing.CorrectAnswer = request.CorrectAnswer.Trim();
        existing.AcceptedAnswersJson = BuildAcceptedAnswersJson(request.CorrectAnswer, request.AcceptedAnswers);
        existing.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        existing.Difficulty = string.IsNullOrWhiteSpace(request.Difficulty) ? null : request.Difficulty.Trim();
        existing.QuestionImageUrl = CleanOptional(request.QuestionImageUrl);
        existing.AnswerImageUrl = CleanOptional(request.AnswerImageUrl);
        existing.AnswerExplanation = CleanOptional(request.AnswerExplanation);
        existing.IsActive = request.IsActive;

        await _triviaQuestionRepository.UpdateAsync(existing);
        return Map(existing);
    }

    public async Task<bool> SetActiveAsync(Guid id, bool isActive)
    {
        var existing = await _triviaQuestionRepository.GetByIdAsync(id);
        if (existing is null) return false;

        await _triviaQuestionRepository.SetActiveAsync(id, isActive);
        return true;
    }

    public Task<int> SetActiveByFilterAsync(
        bool isActive,
        string? category,
        string? difficulty,
        bool? currentIsActive)
    {
        var normalizedCategory = CleanOptional(category);
        var normalizedDifficulty = CleanOptional(difficulty);

        return _triviaQuestionRepository.SetActiveByFilterAsync(
            isActive,
            normalizedCategory,
            normalizedDifficulty,
            currentIsActive);
    }

    private static string BuildAcceptedAnswersJson(string correctAnswer, IEnumerable<string> acceptedAnswers)
    {
        var values = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(correctAnswer))
            values.Add(correctAnswer.Trim());

        foreach (var answer in acceptedAnswers ?? Enumerable.Empty<string>())
        {
            if (!string.IsNullOrWhiteSpace(answer))
                values.Add(answer.Trim());
        }

        return JsonSerializer.Serialize(values.ToList());
    }

    private static TriviaQuestionResponse Map(TriviaQuestion question)
    {
        return new TriviaQuestionResponse
        {
            Id = question.Id,
            QuestionText = question.QuestionText,
            CorrectAnswer = question.CorrectAnswer,
            AcceptedAnswers = question.GetAcceptedAnswers().ToList(),
            Category = question.Category,
            Difficulty = question.Difficulty,
            QuestionImageUrl = question.QuestionImageUrl,
            AnswerImageUrl = question.AnswerImageUrl,
            AnswerExplanation = question.AnswerExplanation,
            IsActive = question.IsActive,
            CreatedAt = question.CreatedAt
        };
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
