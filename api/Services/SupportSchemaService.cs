using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class SupportSchemaService
{
    private readonly DapperContext _context;

    public SupportSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS support_checkout_sessions (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider VARCHAR(20) NOT NULL,
                plan_code VARCHAR(40) NOT NULL,
                supporter_tier VARCHAR(30) NOT NULL,
                merchant_reference VARCHAR(80) NOT NULL UNIQUE,
                amount NUMERIC(10,2) NOT NULL,
                currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
                billing_frequency INT NOT NULL,
                billing_cycles INT NOT NULL,
                payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
                payfast_payment_id VARCHAR(60),
                payfast_subscription_id VARCHAR(80),
                last_payload_json TEXT,
                activated_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS ix_support_checkout_sessions_user_created
                ON support_checkout_sessions(user_id, created_at DESC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
