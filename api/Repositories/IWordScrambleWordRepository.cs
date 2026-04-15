using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IWordScrambleWordRepository
{
    Task<WordScrambleWord?> GetByIdAsync(Guid id);
    Task<WordScrambleWord?> GetRandomActiveAsync(string? category = null);
    Task<IReadOnlyList<WordScrambleWord>> GetActiveAsync(int take = 100);
    Task CreateAsync(WordScrambleWord word);
}