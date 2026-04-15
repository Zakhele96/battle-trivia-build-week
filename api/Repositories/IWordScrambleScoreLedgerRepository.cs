using Bts.Api.Models.Domain;
using System.Data;
using System.Data.Common;

namespace Bts.Api.Repositories;

public interface IWordScrambleScoreLedgerRepository
{
    Task CreateAsync(WordScrambleScoreLedgerEntry entry);

    Task CreateAsync(
        IDbConnection connection,
        WordScrambleScoreLedgerEntry entry,
        DbTransaction? transaction = null);
}