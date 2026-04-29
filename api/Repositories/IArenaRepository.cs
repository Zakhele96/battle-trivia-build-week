using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IArenaRepository
{
    Task CreateChallengeAsync(ArenaChallenge challenge);
    Task<ArenaChallenge?> GetChallengeByIdAsync(Guid challengeId);
    Task<IReadOnlyList<ArenaChallengeResponse>> GetChallengesAsync(Guid roomId, Guid currentUserId, string bucket, int take);
    Task<IReadOnlyList<ArenaEntryResponse>> GetEntriesAsync(Guid challengeId, Guid currentUserId, Guid? winnerEntryId);
    Task<IReadOnlyList<ArenaCommentResponse>> GetCommentsAsync(Guid challengeId);
    Task<bool> HasEntryAsync(Guid challengeId, Guid userId);
    Task<int> GetEntryCountAsync(Guid challengeId);
    Task CreateEntryAsync(ArenaEntry entry);
    Task CreateCommentAsync(ArenaComment comment);
    Task<bool> HasVoteAsync(Guid challengeId, Guid userId);
    Task<bool> EntryBelongsToChallengeAsync(Guid challengeId, Guid entryId);
    Task<bool> EntryBelongsToUserAsync(Guid entryId, Guid userId);
    Task CreateVoteAsync(ArenaVote vote);
    Task<IReadOnlyList<ArenaChallenge>> GetChallengesReadyForVotingAsync(DateTime nowUtc);
    Task<bool> MoveChallengeToVotingAsync(Guid challengeId, DateTime votingStartsAtUtc, DateTime votingEndsAtUtc);
    Task<IReadOnlyList<ArenaChallenge>> GetChallengesReadyToCloseAsync(DateTime nowUtc);
    Task<(Guid? WinnerEntryId, bool IsDraw)> CalculateWinnerAsync(Guid challengeId);
    Task CloseChallengeAsync(Guid challengeId, Guid? winnerEntryId, DateTime updatedAtUtc);
    Task<IReadOnlyList<HallOfBarsItemResponse>> GetHallOfBarsAsync(Guid roomId, int take);
    Task<IReadOnlyList<ArenaLeaderboardRowResponse>> GetLeaderboardAsync(Guid roomId, int take);
}
