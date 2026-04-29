using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class ArenaSchemaService
{
    private readonly DapperContext _context;

    public ArenaSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS arena_challenges (
                id UUID PRIMARY KEY,
                room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
                created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                challenge_type VARCHAR(50) NOT NULL,
                theme VARCHAR(200) NOT NULL,
                rules TEXT NULL,
                max_entries INT NOT NULL DEFAULT 8,
                status VARCHAR(30) NOT NULL DEFAULT 'open',
                submission_ends_at TIMESTAMPTZ NOT NULL,
                voting_starts_at TIMESTAMPTZ NULL,
                voting_ends_at TIMESTAMPTZ NOT NULL,
                winner_entry_id UUID NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS arena_entries (
                id UUID PRIMARY KEY,
                challenge_id UUID NOT NULL REFERENCES arena_challenges(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS arena_votes (
                id UUID PRIMARY KEY,
                challenge_id UUID NOT NULL REFERENCES arena_challenges(id) ON DELETE CASCADE,
                entry_id UUID NOT NULL REFERENCES arena_entries(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS arena_comments (
                id UUID PRIMARY KEY,
                challenge_id UUID NOT NULL REFERENCES arena_challenges(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            ALTER TABLE arena_challenges
                DROP CONSTRAINT IF EXISTS ck_arena_challenges_status;

            ALTER TABLE arena_challenges
                ADD CONSTRAINT ck_arena_challenges_status
                CHECK (status IN ('open', 'voting', 'closed', 'cancelled'));

            ALTER TABLE arena_entries
                DROP CONSTRAINT IF EXISTS uq_arena_entries_challenge_user;

            ALTER TABLE arena_entries
                ADD CONSTRAINT uq_arena_entries_challenge_user UNIQUE (challenge_id, user_id);

            ALTER TABLE arena_votes
                DROP CONSTRAINT IF EXISTS uq_arena_votes_challenge_user;

            ALTER TABLE arena_votes
                ADD CONSTRAINT uq_arena_votes_challenge_user UNIQUE (challenge_id, user_id);

            CREATE INDEX IF NOT EXISTS ix_arena_challenges_room_status
                ON arena_challenges(room_id, status, created_at DESC);

            CREATE INDEX IF NOT EXISTS ix_arena_challenges_submission_ends_at
                ON arena_challenges(status, submission_ends_at);

            CREATE INDEX IF NOT EXISTS ix_arena_challenges_voting_ends_at
                ON arena_challenges(status, voting_ends_at);

            CREATE INDEX IF NOT EXISTS ix_arena_entries_challenge
                ON arena_entries(challenge_id, submitted_at ASC);

            CREATE INDEX IF NOT EXISTS ix_arena_votes_challenge_entry
                ON arena_votes(challenge_id, entry_id);

            CREATE INDEX IF NOT EXISTS ix_arena_comments_challenge
                ON arena_comments(challenge_id, created_at ASC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
