using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class ChallengeInviteSchemaService
{
    private readonly DapperContext _context;

    public ChallengeInviteSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS challenge_invites (
                id UUID PRIMARY KEY,
                challenger_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                rival_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                mode VARCHAR(30) NOT NULL,
                period VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                responded_at TIMESTAMP NULL,
                CONSTRAINT ck_challenge_invites_mode
                    CHECK (mode IN ('combined', 'battle-trivia', 'word-scramble')),
                CONSTRAINT ck_challenge_invites_period
                    CHECK (period IN ('current', 'previous')),
                CONSTRAINT ck_challenge_invites_status
                    CHECK (status IN ('pending', 'accepted', 'declined')),
                CONSTRAINT ck_challenge_invites_users
                    CHECK (challenger_user_id <> rival_user_id)
            );

            CREATE INDEX IF NOT EXISTS ix_challenge_invites_rival_status_created
                ON challenge_invites(rival_user_id, status, created_at DESC);

            CREATE INDEX IF NOT EXISTS ix_challenge_invites_challenger_created
                ON challenge_invites(challenger_user_id, created_at DESC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
