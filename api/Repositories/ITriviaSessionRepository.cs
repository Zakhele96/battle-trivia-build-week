using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface ITriviaSessionRepository
{
    Task<TriviaGameSession?> GetByIdAsync(Guid id);
    Task<TriviaGameSession?> GetActiveByRoomIdAsync(Guid roomId);
    Task CreateAsync(TriviaGameSession session);
    Task EndAsync(Guid sessionId, DateTime endedAtUtc);
    Task UpdateRunModeAsync(Guid sessionId, string runMode);
    Task<TriviaGameSession?> GetLatestEndedByRoomIdAsync(Guid roomId);
    Task<IReadOnlyList<Guid>> GetUserIdsBySessionIdAsync(Guid sessionId);

}