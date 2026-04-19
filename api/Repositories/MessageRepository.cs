using System.Text.Json;
using Bts.Api.Data;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class MessageRepository : IMessageRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly DapperContext _context;

    public MessageRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(
        Guid id,
        Guid roomId,
        Guid? userId,
        string messageText,
        string messageType,
        Guid? replyToMessageId = null)
    {
        const string sql = """
            INSERT INTO chat_messages
            (
                id,
                room_id,
                user_id,
                message_text,
                message_type,
                sent_at,
                reply_to_message_id,
                edited_at,
                is_pinned,
                pinned_at,
                pinned_by_user_id
            )
            VALUES
            (
                @Id,
                @RoomId,
                @UserId,
                @MessageText,
                @MessageType,
                NOW(),
                @ReplyToMessageId,
                NULL,
                FALSE,
                NULL,
                NULL
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            RoomId = roomId,
            UserId = userId,
            MessageText = messageText,
            MessageType = messageType,
            ReplyToMessageId = replyToMessageId
        });
    }

    public async Task<IEnumerable<ChatMessageResponse>> GetRecentByRoomAsync(
        Guid roomId,
        Guid currentUserId,
        int take)
    {
        const string sql = """
            WITH recent_messages AS
            (
                SELECT
                    cm.id,
                    cm.room_id AS RoomId,
                    cm.user_id AS UserId,
                    cm.message_text AS MessageText,
                    cm.message_type AS MessageType,
                    cm.sent_at AS SentAt,
                    cm.reply_to_message_id AS ReplyToMessageId,
                    cm.edited_at AS EditedAt,
                    cm.is_pinned AS IsPinned,
                    cm.pinned_at AS PinnedAt,
                    cm.pinned_by_user_id AS PinnedByUserId,
                    u.username AS Username,
                    u.display_name AS DisplayName,
                    COALESCE(u.is_admin, FALSE) AS IsAdmin,
                    ru.username AS ReplyToUsername,
                    ru.display_name AS ReplyToDisplayName,
                    LEFT(rcm.message_text, 120) AS ReplyToPreviewText
                FROM chat_messages cm
                LEFT JOIN users u
                    ON u.id = cm.user_id
                LEFT JOIN chat_messages rcm
                    ON rcm.id = cm.reply_to_message_id
                LEFT JOIN users ru
                    ON ru.id = rcm.user_id
                WHERE cm.room_id = @RoomId
                ORDER BY cm.sent_at DESC
                LIMIT @Take
            )
            SELECT
                rm.*,
                COALESCE(rj.reactions_json, '[]') AS ReactionsJson
            FROM recent_messages rm
            LEFT JOIN LATERAL
            (
                SELECT COALESCE(
                    json_agg(
                        json_build_object(
                            'emoji', x.emoji,
                            'count', x.reaction_count,
                            'reactedByMe', x.reacted_by_me
                        )
                        ORDER BY x.emoji
                    )::text,
                    '[]'
                ) AS reactions_json
                FROM
                (
                    SELECT
                        r.emoji,
                        COUNT(*)::INT AS reaction_count,
                        BOOL_OR(r.user_id = @CurrentUserId) AS reacted_by_me
                    FROM chat_message_reactions r
                    WHERE r.chat_message_id = rm.id
                    GROUP BY r.emoji
                ) x
            ) rj ON TRUE
            ORDER BY rm.SentAt ASC;
            """;

        using var connection = _context.CreateConnection();

        var rows = await connection.QueryAsync<MessageRow>(sql, new
        {
            RoomId = roomId,
            CurrentUserId = currentUserId,
            Take = take
        });

        return rows.Select(MapRow).ToList();
    }

    public async Task<ChatMessageResponse?> GetByIdAsync(Guid messageId, Guid currentUserId)
    {
        const string sql = """
            SELECT
                cm.id,
                cm.room_id AS RoomId,
                cm.user_id AS UserId,
                cm.message_text AS MessageText,
                cm.message_type AS MessageType,
                cm.sent_at AS SentAt,
                cm.reply_to_message_id AS ReplyToMessageId,
                cm.edited_at AS EditedAt,
                cm.is_pinned AS IsPinned,
                cm.pinned_at AS PinnedAt,
                cm.pinned_by_user_id AS PinnedByUserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                COALESCE(u.is_admin, FALSE) AS IsAdmin,
                ru.username AS ReplyToUsername,
                ru.display_name AS ReplyToDisplayName,
                LEFT(rcm.message_text, 120) AS ReplyToPreviewText,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'emoji', x.emoji,
                                'count', x.reaction_count,
                                'reactedByMe', x.reacted_by_me
                            )
                            ORDER BY x.emoji
                        )::text
                        FROM
                        (
                            SELECT
                                r.emoji,
                                COUNT(*)::INT AS reaction_count,
                                BOOL_OR(r.user_id = @CurrentUserId) AS reacted_by_me
                            FROM chat_message_reactions r
                            WHERE r.chat_message_id = cm.id
                            GROUP BY r.emoji
                        ) x
                    ),
                    '[]'
                ) AS ReactionsJson
            FROM chat_messages cm
            LEFT JOIN users u
                ON u.id = cm.user_id
            LEFT JOIN chat_messages rcm
                ON rcm.id = cm.reply_to_message_id
            LEFT JOIN users ru
                ON ru.id = rcm.user_id
            WHERE cm.id = @MessageId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();

        var row = await connection.QuerySingleOrDefaultAsync<MessageRow>(sql, new
        {
            MessageId = messageId,
            CurrentUserId = currentUserId
        });

        return row is null ? null : MapRow(row);
    }

    public async Task<Guid?> GetRoomIdByMessageIdAsync(Guid messageId)
    {
        const string sql = """
            SELECT room_id
            FROM chat_messages
            WHERE id = @MessageId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid?>(sql, new { MessageId = messageId });
    }

    public async Task DeleteAsync(Guid messageId)
    {
        const string sql = """
            DELETE FROM chat_messages
            WHERE id = @MessageId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { MessageId = messageId });
    }

    public async Task<bool> MessageExistsInRoomAsync(Guid roomId, Guid messageId)
    {
        const string sql = """
            SELECT EXISTS
            (
                SELECT 1
                FROM chat_messages
                WHERE id = @MessageId
                  AND room_id = @RoomId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new
        {
            RoomId = roomId,
            MessageId = messageId
        });
    }

    public async Task<bool> UserOwnsMessageAsync(Guid messageId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS
            (
                SELECT 1
                FROM chat_messages
                WHERE id = @MessageId
                  AND user_id = @UserId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new
        {
            MessageId = messageId,
            UserId = userId
        });
    }

    public async Task UpdateTextAsync(Guid messageId, string messageText, DateTime editedAtUtc)
    {
        const string sql = """
            UPDATE chat_messages
            SET
                message_text = @MessageText,
                edited_at = @EditedAtUtc
            WHERE id = @MessageId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            MessageId = messageId,
            MessageText = messageText,
            EditedAtUtc = editedAtUtc
        });
    }

    public async Task ToggleReactionAsync(Guid messageId, Guid userId, string emoji)
    {
        const string existingSql = """
            SELECT id
            FROM chat_message_reactions
            WHERE chat_message_id = @MessageId
              AND user_id = @UserId
              AND emoji = @Emoji
            LIMIT 1;
            """;

        const string deleteSql = """
            DELETE FROM chat_message_reactions
            WHERE id = @Id;
            """;

        const string insertSql = """
            INSERT INTO chat_message_reactions
            (
                id,
                chat_message_id,
                user_id,
                emoji,
                created_at
            )
            VALUES
            (
                @Id,
                @MessageId,
                @UserId,
                @Emoji,
                NOW()
            );
            """;

        using var connection = _context.CreateConnection();

        var existingId = await connection.ExecuteScalarAsync<Guid?>(existingSql, new
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji
        });

        if (existingId.HasValue)
        {
            await connection.ExecuteAsync(deleteSql, new { Id = existingId.Value });
            return;
        }

        await connection.ExecuteAsync(insertSql, new
        {
            Id = Guid.NewGuid(),
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji
        });
    }

    public async Task<List<ChatMessageReactionResponse>> GetReactionsAsync(Guid messageId, Guid currentUserId)
    {
        const string sql = """
            SELECT
                emoji AS Emoji,
                COUNT(*)::INT AS Count,
                BOOL_OR(user_id = @CurrentUserId) AS ReactedByMe
            FROM chat_message_reactions
            WHERE chat_message_id = @MessageId
            GROUP BY emoji
            ORDER BY emoji;
            """;

        using var connection = _context.CreateConnection();

        var rows = await connection.QueryAsync<ChatMessageReactionResponse>(sql, new
        {
            MessageId = messageId,
            CurrentUserId = currentUserId
        });

        return rows.ToList();
    }

    public async Task PinMessageAsync(Guid roomId, Guid messageId, Guid pinnedByUserId, DateTime pinnedAtUtc)
    {
        const string clearSql = """
            UPDATE chat_messages
            SET
                is_pinned = FALSE,
                pinned_at = NULL,
                pinned_by_user_id = NULL
            WHERE room_id = @RoomId
              AND is_pinned = TRUE;
            """;

        const string pinSql = """
            UPDATE chat_messages
            SET
                is_pinned = TRUE,
                pinned_at = @PinnedAtUtc,
                pinned_by_user_id = @PinnedByUserId
            WHERE room_id = @RoomId
              AND id = @MessageId;
            """;

        using var connection = _context.CreateConnection();
        connection.Open();

        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync(clearSql, new { RoomId = roomId }, transaction);
        await connection.ExecuteAsync(pinSql, new
        {
            RoomId = roomId,
            MessageId = messageId,
            PinnedAtUtc = pinnedAtUtc,
            PinnedByUserId = pinnedByUserId
        }, transaction);

        transaction.Commit();
    }

    public async Task UnpinRoomAsync(Guid roomId)
    {
        const string sql = """
            UPDATE chat_messages
            SET
                is_pinned = FALSE,
                pinned_at = NULL,
                pinned_by_user_id = NULL
            WHERE room_id = @RoomId
              AND is_pinned = TRUE;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { RoomId = roomId });
    }

    public async Task<ChatMessageResponse?> GetPinnedByRoomAsync(Guid roomId, Guid currentUserId)
    {
        const string sql = """
            SELECT
                cm.id,
                cm.room_id AS RoomId,
                cm.user_id AS UserId,
                cm.message_text AS MessageText,
                cm.message_type AS MessageType,
                cm.sent_at AS SentAt,
                cm.reply_to_message_id AS ReplyToMessageId,
                cm.edited_at AS EditedAt,
                cm.is_pinned AS IsPinned,
                cm.pinned_at AS PinnedAt,
                cm.pinned_by_user_id AS PinnedByUserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                COALESCE(u.is_admin, FALSE) AS IsAdmin,
                ru.username AS ReplyToUsername,
                ru.display_name AS ReplyToDisplayName,
                LEFT(rcm.message_text, 120) AS ReplyToPreviewText,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'emoji', x.emoji,
                                'count', x.reaction_count,
                                'reactedByMe', x.reacted_by_me
                            )
                            ORDER BY x.emoji
                        )::text
                        FROM
                        (
                            SELECT
                                r.emoji,
                                COUNT(*)::INT AS reaction_count,
                                BOOL_OR(r.user_id = @CurrentUserId) AS reacted_by_me
                            FROM chat_message_reactions r
                            WHERE r.chat_message_id = cm.id
                            GROUP BY r.emoji
                        ) x
                    ),
                    '[]'
                ) AS ReactionsJson
            FROM chat_messages cm
            LEFT JOIN users u
                ON u.id = cm.user_id
            LEFT JOIN chat_messages rcm
                ON rcm.id = cm.reply_to_message_id
            LEFT JOIN users ru
                ON ru.id = rcm.user_id
            WHERE cm.room_id = @RoomId
              AND cm.is_pinned = TRUE
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();

        var row = await connection.QuerySingleOrDefaultAsync<MessageRow>(sql, new
        {
            RoomId = roomId,
            CurrentUserId = currentUserId
        });

        return row is null ? null : MapRow(row);
    }

    private static ChatMessageResponse MapRow(MessageRow row)
    {
        return new ChatMessageResponse
        {
            Id = row.Id,
            RoomId = row.RoomId,
            UserId = row.UserId,
            Username = row.Username,
            IsAdmin = row.IsAdmin,
            DisplayName = row.DisplayName,
            MessageText = row.MessageText,
            MessageType = row.MessageType,
            SentAt = row.SentAt,
            ReplyToMessageId = row.ReplyToMessageId,
            ReplyToUsername = row.ReplyToUsername,
            ReplyToDisplayName = row.ReplyToDisplayName,
            ReplyToPreviewText = row.ReplyToPreviewText,
            EditedAt = row.EditedAt,
            IsEdited = row.EditedAt.HasValue,
            IsPinned = row.IsPinned,
            PinnedAt = row.PinnedAt,
            PinnedByUserId = row.PinnedByUserId,
            Reactions = string.IsNullOrWhiteSpace(row.ReactionsJson)
                ? new List<ChatMessageReactionResponse>()
                : JsonSerializer.Deserialize<List<ChatMessageReactionResponse>>(row.ReactionsJson, JsonOptions)
                  ?? new List<ChatMessageReactionResponse>()
        };
    }

    private sealed class MessageRow
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Guid? UserId { get; set; }
        public string? Username { get; set; }
        public bool IsAdmin { get; set; }
        public string? DisplayName { get; set; }
        public string MessageText { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public Guid? ReplyToMessageId { get; set; }
        public string? ReplyToUsername { get; set; }
        public string? ReplyToDisplayName { get; set; }
        public string? ReplyToPreviewText { get; set; }
        public DateTime? EditedAt { get; set; }
        public bool IsPinned { get; set; }
        public DateTime? PinnedAt { get; set; }
        public Guid? PinnedByUserId { get; set; }
        public string? ReactionsJson { get; set; }
    }
}