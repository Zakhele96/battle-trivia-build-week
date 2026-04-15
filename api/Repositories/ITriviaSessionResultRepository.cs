using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface ITriviaSessionResultRepository
{
    Task<bool> ExistsForSessionAsync(Guid sessionId);
    Task CreateManyAsync(IEnumerable<TriviaSessionResult> rows);
    Task<IReadOnlyList<TriviaSessionResultRowDto>> GetBySessionIdAsync(Guid sessionId, int take = 10);

    Task<IReadOnlyList<TriviaSessionResultRowDto>> GetLatestResultsAsync(int take = 3);
    Task<TriviaSessionResultRowDto?> GetUserBySessionIdAsync(Guid sessionId, Guid userId);
}