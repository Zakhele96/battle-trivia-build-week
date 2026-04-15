using System.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface ITriviaAnswerRepository
{
    Task CreateAsync(
        IDbConnection connection,
        TriviaAnswer answer,
        IDbTransaction? transaction = null);

    Task<bool> HasUserCorrectAnswerAsync(
        IDbConnection connection,
        Guid roundId,
        Guid userId,
        IDbTransaction? transaction = null);

    Task<int> GetCorrectCountAsync(
        IDbConnection connection,
        Guid roundId,
        IDbTransaction? transaction = null);

    Task<int> GetWrongAttemptCountAsync(Guid roundId, Guid userId);

    Task<DateTime?> GetLatestSubmissionAtAsync(Guid roundId, Guid userId);

    Task<IEnumerable<TriviaCorrectAnswerResult>> GetCorrectResultsByRoundAsync(Guid roundId);
}