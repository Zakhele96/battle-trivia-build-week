using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;

namespace Bts.Api.Repositories;

public interface IBattleItRepository
{
    Task<BattleItSession?> GetVisibleSessionAsync(Guid roomId, Guid userId);
    Task<BattleItSession?> GetByIdAsync(Guid sessionId);
    Task<BattleItSession?> GetActiveByRoomIdAsync(Guid roomId);
    Task<IReadOnlyList<BattleItQuestion>> GetQuestionsAsync(Guid sessionId);
    Task<BattleItQuestion?> GetQuestionAtPositionAsync(Guid sessionId, int position);
    Task<BattleItQuestion?> GetQuestionByIdAsync(Guid sessionId, Guid questionId);
    Task<BattleItSession> CreateDraftAsync(
        Guid roomId,
        Guid creatorUserId,
        string sourceType,
        string? sourceLabel,
        string sourceHash,
        string difficulty,
        int questionDurationSeconds,
        string model,
        BattleItGeneratedPack pack);
    Task<bool> UpdateDraftAsync(
        Guid sessionId,
        Guid creatorUserId,
        UpdateBattleItDraftRequest request);
    Task<bool> OpenLobbyAsync(Guid sessionId, Guid creatorUserId);
    Task<TriviaGameSession?> StartAsync(Guid sessionId, Guid creatorUserId);
    Task<bool> ReplayAsync(Guid sessionId, Guid creatorUserId);
    Task CompleteAsync(Guid sessionId, DateTime completedAtUtc);
}
