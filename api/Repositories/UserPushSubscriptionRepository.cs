using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class UserPushSubscriptionRepository : IUserPushSubscriptionRepository
{
    private readonly DapperContext _context;

    public UserPushSubscriptionRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task UpsertAsync(UserPushSubscription subscription)
    {
        const string sql = """
            INSERT INTO user_push_subscriptions (
                id,
                user_id,
                endpoint,
                p256dh,
                auth,
                user_agent,
                created_at,
                updated_at,
                last_notified_at
            )
            VALUES (
                @Id,
                @UserId,
                @Endpoint,
                @P256dh,
                @Auth,
                @UserAgent,
                @CreatedAt,
                @UpdatedAt,
                @LastNotifiedAt
            )
            ON CONFLICT (endpoint)
            DO UPDATE SET
                user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                user_agent = EXCLUDED.user_agent,
                updated_at = EXCLUDED.updated_at;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, subscription);
    }

    public async Task<IReadOnlyList<UserPushSubscription>> GetByUserIdAsync(Guid userId)
    {
        const string sql = """
            SELECT
                id,
                user_id AS UserId,
                endpoint,
                p256dh,
                auth,
                user_agent AS UserAgent,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                last_notified_at AS LastNotifiedAt
            FROM user_push_subscriptions
            WHERE user_id = @UserId
            ORDER BY updated_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<UserPushSubscription>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task DeleteByEndpointAsync(Guid userId, string endpoint)
    {
        const string sql = """
            DELETE FROM user_push_subscriptions
            WHERE user_id = @UserId
              AND endpoint = @Endpoint;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { UserId = userId, Endpoint = endpoint });
    }

    public async Task TouchLastNotifiedAsync(Guid subscriptionId, DateTime notifiedAtUtc)
    {
        const string sql = """
            UPDATE user_push_subscriptions
            SET last_notified_at = @NotifiedAtUtc,
                updated_at = @NotifiedAtUtc
            WHERE id = @SubscriptionId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { SubscriptionId = subscriptionId, NotifiedAtUtc = notifiedAtUtc });
    }
}
