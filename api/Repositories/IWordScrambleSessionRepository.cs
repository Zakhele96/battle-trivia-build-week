using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IWordScrambleSessionRepository
{
    Task<WordScrambleSession?> GetByIdAsync(Guid id);
    Task<WordScrambleSession?> GetActiveByRoomIdAsync(Guid roomId);
    Task<WordScrambleSession?> GetLatestEndedByRoomIdAsync(Guid roomId);
    Task CreateAsync(WordScrambleSession session);
    Task EndAsync(Guid sessionId, DateTime endedAtUtc);
    Task UpdateRunModeAsync(Guid sessionId, string runMode);
}