using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class DirectMessageRepository : IDirectMessageRepository
{
    private readonly DapperContext _context;

    public DirectMessageRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<DirectConversation?> GetConversationByIdAsync(Guid conversationId)
    {
        const string sql = """
            SELECT
                id,
                user_a_id AS UserAId,
                user_b_id AS UserBId,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM direct_conversations
            WHERE id = @ConversationId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<DirectConversation>(sql, new { ConversationId = conversationId });
    }

    public async Task<DirectConversation?> GetConversationForUsersAsync(Guid userId, Guid otherUserId)
    {
        const string sql = """
            SELECT
                id,
                user_a_id AS UserAId,
                user_b_id AS UserBId,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM direct_conversations
            WHERE (user_a_id = @UserId AND user_b_id = @OtherUserId)
               OR (user_a_id = @OtherUserId AND user_b_id = @UserId)
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<DirectConversation>(sql, new
        {
            UserId = userId,
            OtherUserId = otherUserId
        });
    }

    public async Task<DirectConversation> GetOrCreateConversationAsync(Guid userId, Guid otherUserId)
    {
        var existing = await GetConversationForUsersAsync(userId, otherUserId);
        if (existing is not null)
            return existing;

        var normalizedA = userId.CompareTo(otherUserId) < 0 ? userId : otherUserId;
        var normalizedB = userId.CompareTo(otherUserId) < 0 ? otherUserId : userId;
        var conversation = new DirectConversation
        {
            Id = Guid.NewGuid(),
            UserAId = normalizedA,
            UserBId = normalizedB,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        const string insertSql = """
            INSERT INTO direct_conversations (
                id,
                user_a_id,
                user_b_id,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @UserAId,
                @UserBId,
                @CreatedAt,
                @UpdatedAt
            )
            ON CONFLICT DO NOTHING;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(insertSql, conversation);

        return await GetConversationForUsersAsync(userId, otherUserId)
            ?? conversation;
    }

    public async Task<IReadOnlyList<DirectConversationResponse>> GetConversationsAsync(Guid userId)
    {
        const string sql = """
            WITH user_conversations AS (
                SELECT
                    c.id,
                    CASE
                        WHEN c.user_a_id = @UserId THEN c.user_b_id
                        ELSE c.user_a_id
                    END AS other_user_id
                FROM direct_conversations c
                WHERE c.user_a_id = @UserId OR c.user_b_id = @UserId
            ),
            last_messages AS (
                SELECT DISTINCT ON (m.conversation_id)
                    m.conversation_id,
                    m.message_text,
                    m.sent_at,
                    m.sender_user_id
                FROM direct_messages m
                ORDER BY m.conversation_id, m.sent_at DESC
            ),
            unread_counts AS (
                SELECT
                    conversation_id,
                    COUNT(*)::int AS unread_count
                FROM direct_messages
                WHERE recipient_user_id = @UserId
                  AND read_at IS NULL
                GROUP BY conversation_id
            )
            SELECT
                uc.id AS ConversationId,
                uc.other_user_id AS OtherUserId,
                u.username AS OtherUsername,
                u.display_name AS OtherDisplayName,
                lm.message_text AS LastMessageText,
                lm.sent_at AS LastMessageAt,
                lm.sender_user_id AS LastMessageSenderUserId,
                COALESCE(ucount.unread_count, 0) AS UnreadCount
            FROM user_conversations uc
            INNER JOIN users u
                ON u.id = uc.other_user_id
            LEFT JOIN last_messages lm
                ON lm.conversation_id = uc.id
            LEFT JOIN unread_counts ucount
                ON ucount.conversation_id = uc.id
            ORDER BY COALESCE(lm.sent_at, u.updated_at) DESC, u.display_name ASC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<DirectConversationResponse>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<IReadOnlyList<DirectMessageResponse>> GetMessagesAsync(Guid conversationId, int take = 50)
    {
        const string sql = """
            SELECT
                m.id AS Id,
                m.conversation_id AS ConversationId,
                m.sender_user_id AS SenderUserId,
                sender.username AS SenderUsername,
                sender.display_name AS SenderDisplayName,
                m.recipient_user_id AS RecipientUserId,
                m.message_text AS MessageText,
                m.sent_at AS SentAt,
                m.read_at AS ReadAt
            FROM direct_messages m
            INNER JOIN users sender
                ON sender.id = m.sender_user_id
            WHERE m.conversation_id = @ConversationId
            ORDER BY m.sent_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<DirectMessageResponse>(sql, new
        {
          ConversationId = conversationId,
          Take = Math.Clamp(take, 1, 100)
        });
        return rows.Reverse().ToList();
    }

    public async Task<bool> IsParticipantAsync(Guid conversationId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM direct_conversations
                WHERE id = @ConversationId
                  AND (user_a_id = @UserId OR user_b_id = @UserId)
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { ConversationId = conversationId, UserId = userId });
    }

    public async Task CreateMessageAsync(DirectMessage message)
    {
        const string sql = """
            INSERT INTO direct_messages (
                id,
                conversation_id,
                sender_user_id,
                recipient_user_id,
                message_text,
                sent_at,
                read_at
            )
            VALUES (
                @Id,
                @ConversationId,
                @SenderUserId,
                @RecipientUserId,
                @MessageText,
                @SentAt,
                @ReadAt
            );

            UPDATE direct_conversations
            SET updated_at = @SentAt
            WHERE id = @ConversationId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, message);
    }

    public async Task MarkConversationReadAsync(Guid conversationId, Guid userId, DateTime readAtUtc)
    {
        const string sql = """
            UPDATE direct_messages
            SET read_at = @ReadAtUtc
            WHERE conversation_id = @ConversationId
              AND recipient_user_id = @UserId
              AND read_at IS NULL;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { ConversationId = conversationId, UserId = userId, ReadAtUtc = readAtUtc });
    }
}
