using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class BattleTriviaPrizeOpsSchemaService
{
    private readonly DapperContext _context;

    public BattleTriviaPrizeOpsSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS battle_trivia_prize_payouts (
                id UUID PRIMARY KEY,
                session_id UUID NOT NULL REFERENCES trivia_game_sessions(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                rank INT NOT NULL,
                amount NUMERIC(10,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                reference VARCHAR(120) NULL,
                notes TEXT NULL,
                paid_at TIMESTAMP NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_battle_trivia_prize_payouts_session_user UNIQUE(session_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS ix_battle_trivia_prize_payouts_session
                ON battle_trivia_prize_payouts(session_id, rank ASC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
