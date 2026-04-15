using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface IWordScrambleRoundRepository
{
    Task<WordScrambleRound?> GetByIdAsync(Guid id);
    Task<WordScrambleRoundDetailsDto?> GetActiveRoundDetailsByRoomIdAsync(Guid roomId);
    Task<WordScrambleRound?> GetLatestBySessionIdAsync(Guid sessionId);
    Task CreateAsync(WordScrambleRound round);
    Task UpdateCurrentMaskAsync(Guid roundId, string currentMask);
    Task RevealAsync(Guid roundId, string finalMask, DateTime revealedAtUtc);
    Task CloseAsync(Guid roundId);
}