using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface ITriviaSessionWindowRepository
{
    Task<IReadOnlyList<TriviaSessionWindow>> GetActiveBySessionIdAsync(Guid sessionId);
    Task ReplaceAsync(Guid sessionId, IEnumerable<TriviaSessionWindow> windows);
}