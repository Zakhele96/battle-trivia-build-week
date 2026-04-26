using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class DirectMessageSchemaService
{
    private readonly DapperContext _context;

    public DirectMessageSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS direct_conversations (
                id UUID PRIMARY KEY,
                user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT ck_direct_conversation_users
                    CHECK (user_a_id <> user_b_id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_direct_conversation_pair
                ON direct_conversations(
                    LEAST(user_a_id, user_b_id),
                    GREATEST(user_a_id, user_b_id)
                );

            CREATE TABLE IF NOT EXISTS direct_messages (
                id UUID PRIMARY KEY,
                conversation_id UUID NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
                sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message_text TEXT NOT NULL,
                sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                read_at TIMESTAMPTZ NULL
            );

            CREATE INDEX IF NOT EXISTS ix_direct_messages_conversation_sent
                ON direct_messages(conversation_id, sent_at DESC);

            CREATE INDEX IF NOT EXISTS ix_direct_messages_recipient_unread
                ON direct_messages(recipient_user_id, read_at, sent_at DESC);

            CREATE TABLE IF NOT EXISTS user_presence (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                last_seen_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
