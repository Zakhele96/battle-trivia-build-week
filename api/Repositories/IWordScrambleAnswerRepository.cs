using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using System.Data;
using System.Data.Common;

namespace Bts.Api.Repositories;

public interface IWordScrambleAnswerRepository
{
    Task CreateAsync(WordScrambleAnswer answer);
    Task CreateAsync(
        IDbConnection connection,
        WordScrambleAnswer answer,
        DbTransaction? transaction = null);

    Task<DateTime?> GetLatestSubmissionAtAsync(Guid roundId, Guid userId);
    Task<int> GetWrongAttemptCountAsync(Guid roundId, Guid userId);

    Task<bool> HasUserCorrectAnswerAsync(
        IDbConnection connection,
        Guid roundId,
        Guid userId,
        DbTransaction? transaction = null);

    Task<int> GetCorrectCountAsync(
        IDbConnection connection,
        Guid roundId,
        DbTransaction? transaction = null);

    Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetRoundWinnersAsync(Guid roundId, int take = 5);
}