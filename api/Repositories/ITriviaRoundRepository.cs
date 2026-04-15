using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface ITriviaRoundRepository
{
    Task<TriviaRound?> GetByIdAsync(Guid id);
    Task<TriviaRound?> GetActiveBySessionIdAsync(Guid sessionId);
    Task<TriviaRound?> GetLatestBySessionIdAsync(Guid sessionId);
    Task<int> GetLatestRoundNumberAsync(Guid sessionId);
    Task<TriviaRoundDetails?> GetActiveRoundDetailsByRoomIdAsync(Guid roomId);
    Task CreateAsync(TriviaRound round);
    Task SetStatusAsync(Guid roundId, string status);
}