using Bts.Api.Data;
using Dapper;
using Npgsql;

namespace Bts.Api.Services;

public sealed class GrowthSchemaService
{
    private readonly DapperContext _context;

    public GrowthSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS growth_share_events (
                id UUID PRIMARY KEY,
                sharer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                event_type VARCHAR(20) NOT NULL,
                leaderboard_mode VARCHAR(30) NOT NULL,
                leaderboard_period VARCHAR(20) NOT NULL,
                source_context VARCHAR(40) NOT NULL DEFAULT 'leaderboard-share',
                user_agent TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT ck_growth_share_events_type
                    CHECK (event_type IN ('view', 'cta-click')),
                CONSTRAINT ck_growth_share_events_mode
                    CHECK (leaderboard_mode IN ('combined', 'battle-trivia', 'word-scramble')),
                CONSTRAINT ck_growth_share_events_period
                    CHECK (leaderboard_period IN ('current', 'previous'))
            );

            CREATE INDEX IF NOT EXISTS ix_growth_share_events_sharer_created
            ON growth_share_events(sharer_user_id, created_at DESC);

            CREATE INDEX IF NOT EXISTS ix_growth_share_events_board
            ON growth_share_events(leaderboard_mode, leaderboard_period, event_type, created_at DESC);

            CREATE TABLE IF NOT EXISTS growth_referrals (
                id UUID PRIMARY KEY,
                referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                source_context VARCHAR(40) NOT NULL DEFAULT 'leaderboard-share',
                leaderboard_mode VARCHAR(30),
                leaderboard_period VARCHAR(20),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT ck_growth_referrals_not_self
                    CHECK (referrer_user_id <> referred_user_id),
                CONSTRAINT ck_growth_referrals_mode
                    CHECK (leaderboard_mode IS NULL OR leaderboard_mode IN ('combined', 'battle-trivia', 'word-scramble')),
                CONSTRAINT ck_growth_referrals_period
                    CHECK (leaderboard_period IS NULL OR leaderboard_period IN ('current', 'previous'))
            );

            CREATE INDEX IF NOT EXISTS ix_growth_referrals_referrer_created
            ON growth_referrals(referrer_user_id, created_at DESC);
            """;

        await using var connection = (NpgsqlConnection)_context.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(sql);
    }
}
