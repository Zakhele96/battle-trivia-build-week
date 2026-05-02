using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface ITriviaQuestionRepository
{
    Task<TriviaQuestion?> GetByIdAsync(Guid id);
    Task<TriviaQuestion?> GetRandomActiveAsync(Guid[]? excludeQuestionIds = null);

    Task<IEnumerable<TriviaQuestion>> GetAllAsync(
        string? category = null,
        string? difficulty = null,
        bool? isActive = null);

    Task CreateAsync(TriviaQuestion question);
    Task UpdateAsync(TriviaQuestion question);
    Task SetActiveAsync(Guid id, bool isActive);
    Task<int> SetActiveByFilterAsync(
        bool isActive,
        string? category = null,
        string? difficulty = null,
        bool? currentIsActive = null);
}
