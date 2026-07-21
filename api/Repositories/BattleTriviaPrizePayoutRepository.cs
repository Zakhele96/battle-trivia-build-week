using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class BattleTriviaPrizePayoutRepository : IBattleTriviaPrizePayoutRepository
{
    private readonly DapperContext _context;

    public BattleTriviaPrizePayoutRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<BattleTriviaPrizePayout>> GetBySessionIdsAsync(IEnumerable<Guid> sessionIds)
    {
        var ids = sessionIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        if (ids.Length == 0)
        {
            return Array.Empty<BattleTriviaPrizePayout>();
        }

        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                user_id AS UserId,
                rank,
                amount,
                status,
                reference,
                notes,
                paid_at AS PaidAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM battle_trivia_prize_payouts
            WHERE session_id = ANY(@SessionIds);
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<BattleTriviaPrizePayout>(sql, new { SessionIds = ids });
        return rows.ToList();
    }

    public async Task<BattleTriviaPrizePayout?> GetBySessionAndUserAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            SELECT
                id,
                session_id AS SessionId,
                user_id AS UserId,
                rank,
                amount,
                status,
                reference,
                notes,
                paid_at AS PaidAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM battle_trivia_prize_payouts
            WHERE session_id = @SessionId
              AND user_id = @UserId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<BattleTriviaPrizePayout>(sql, new
        {
            SessionId = sessionId,
            UserId = userId
        });
    }

    public async Task UpsertAsync(BattleTriviaPrizePayout payout)
    {
        const string sql = """
            INSERT INTO battle_trivia_prize_payouts (
                id,
                session_id,
                user_id,
                rank,
                amount,
                status,
                reference,
                notes,
                paid_at,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @SessionId,
                @UserId,
                @Rank,
                @Amount,
                @Status,
                @Reference,
                @Notes,
                @PaidAt,
                @CreatedAt,
                @UpdatedAt
            )
            ON CONFLICT (session_id, user_id)
            DO UPDATE SET
                rank = EXCLUDED.rank,
                amount = EXCLUDED.amount,
                status = EXCLUDED.status,
                reference = EXCLUDED.reference,
                notes = EXCLUDED.notes,
                paid_at = EXCLUDED.paid_at,
                updated_at = EXCLUDED.updated_at;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, payout);
    }
}
