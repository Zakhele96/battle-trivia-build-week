using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class FriendSchemaService
{
    private readonly DapperContext _context;

    public FriendSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS friendships (
                id UUID PRIMARY KEY,
                requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                addressee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                responded_at TIMESTAMPTZ NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT ck_friendships_status
                    CHECK (status IN ('pending', 'accepted', 'declined')),
                CONSTRAINT ck_friendships_users
                    CHECK (requester_user_id <> addressee_user_id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_friendships_pair
                ON friendships(
                    LEAST(requester_user_id, addressee_user_id),
                    GREATEST(requester_user_id, addressee_user_id)
                );

            CREATE INDEX IF NOT EXISTS ix_friendships_requester_status
                ON friendships(requester_user_id, status, updated_at DESC);

            CREATE INDEX IF NOT EXISTS ix_friendships_addressee_status
                ON friendships(addressee_user_id, status, updated_at DESC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
