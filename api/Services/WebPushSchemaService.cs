using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class WebPushSchemaService
{
    private readonly DapperContext _context;

    public WebPushSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS user_push_subscriptions (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                endpoint TEXT NOT NULL UNIQUE,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_notified_at TIMESTAMPTZ NULL
            );

            CREATE INDEX IF NOT EXISTS ix_user_push_subscriptions_user
                ON user_push_subscriptions(user_id, updated_at DESC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
