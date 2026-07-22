using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IBattleItRepository
{
    Task<BattleItSession?> GetVisibleSessionAsync(Guid roomId, Guid userId);
    Task<BattleItSession?> GetByIdAsync(Guid sessionId);
    Task<BattleItSession?> JoinByCodeAsync(Guid roomId, Guid userId, string joinCode);
    Task<BattleItSession?> JoinPublicAsync(Guid roomId, Guid sessionId, Guid userId);
    Task<IReadOnlyList<BattleItPublicSessionResponse>> GetPublicSessionsAsync(Guid roomId);
    Task<bool> IsMemberAsync(Guid sessionId, Guid userId);
    Task<int> GetMemberCountAsync(Guid sessionId);
    Task<bool> JoinCodeExistsAsync(string joinCode);
    Task<bool> SetJoinCodeIfMissingAsync(Guid sessionId, Guid creatorUserId, string joinCode);
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
        string answerMode,
        string visibility,
        int questionDurationSeconds,
        int revealDelaySeconds,
        string joinCode,
        string model,
        BattleItGeneratedPack pack);
    Task<bool> UpdateDraftAsync(
        Guid sessionId,
        Guid creatorUserId,
        UpdateBattleItDraftRequest request);
    Task<bool> OpenLobbyAsync(Guid sessionId, Guid creatorUserId, string joinCode);
    Task<TriviaGameSession?> StartAsync(Guid sessionId, Guid creatorUserId);
    Task<bool> ReplayAsync(Guid sessionId, Guid creatorUserId, string joinCode);
    Task CompleteAsync(Guid sessionId, DateTime completedAtUtc);
}
