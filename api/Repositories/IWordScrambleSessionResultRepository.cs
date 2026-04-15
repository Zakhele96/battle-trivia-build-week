using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface IWordScrambleSessionResultRepository
{
    Task<bool> ExistsForSessionAsync(Guid sessionId);
    Task CreateManyAsync(IEnumerable<WordScrambleSessionResult> rows);
    Task<IReadOnlyList<WordScrambleSessionResultRowDto>> GetBySessionIdAsync(Guid sessionId, int take = 10);
    Task<IReadOnlyList<Guid>> GetUserIdsBySessionIdAsync(Guid sessionId);
}