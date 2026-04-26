using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IWordScrambleWordRepository
{
    Task<WordScrambleWord?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<WordScrambleWord>> GetAllAsync(string? category, bool? isActive, int take = 200);
    Task<WordScrambleWord?> GetRandomActiveAsync(string? category = null);
    Task<IReadOnlyList<WordScrambleWord>> GetActiveAsync(int take = 100);
    Task CreateAsync(WordScrambleWord word);
    Task UpdateAsync(WordScrambleWord word);
    Task SetActiveAsync(Guid id, bool isActive);
}
