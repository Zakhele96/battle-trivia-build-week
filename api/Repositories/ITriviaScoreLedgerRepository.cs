using System.Data;
using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface ITriviaScoreLedgerRepository
{
    Task CreateAsync(
        IDbConnection connection,
        TriviaScoreLedgerEntry entry,
        IDbTransaction? transaction = null);
}