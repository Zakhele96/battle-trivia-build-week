using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IBattleTriviaPrizePayoutRepository
{
    Task<IReadOnlyList<BattleTriviaPrizePayout>> GetBySessionIdsAsync(IEnumerable<Guid> sessionIds);
    Task<BattleTriviaPrizePayout?> GetBySessionAndUserAsync(Guid sessionId, Guid userId);
    Task UpsertAsync(BattleTriviaPrizePayout payout);
}
