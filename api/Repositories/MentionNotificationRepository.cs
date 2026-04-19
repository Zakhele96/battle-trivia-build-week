using Bts.Api.Data;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class MentionNotificationRepository : IMentionNotificationRepository
{
    private readonly DapperContext _context;

    public MentionNotificationRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(
        Guid id,
        Guid mentionedUserId,
        Guid sourceUserId,
        Guid roomId,
        Guid chatMessageId,
        string previewText,
        string? sourceDisplayName,
        string? sourceUsername)
    {
        const string sql = """
            INSERT INTO mention_notifications
            (
                id,
                mentioned_user_id,
                source_user_id,
                room_id,
                chat_message_id,
                preview_text,
                source_display_name,
                source_username,
                created_at,
                read_at
            )
            VALUES
            (
                @Id,
                @MentionedUserId,
                @SourceUserId,
                @RoomId,
                @ChatMessageId,
                @PreviewText,
                @SourceDisplayName,
                @SourceUsername,
                NOW(),
                NULL
            )
            ON CONFLICT (mentioned_user_id, chat_message_id) DO NOTHING;
            """;

        using var connection = _context.CreateConnection();

        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            MentionedUserId = mentionedUserId,
            SourceUserId = sourceUserId,
            RoomId = roomId,
            ChatMessageId = chatMessageId,
            PreviewText = previewText,
            SourceDisplayName = sourceDisplayName,
            SourceUsername = sourceUsername
        });
    }

    public async Task<Dictionary<Guid, int>> GetUnreadCountsByRoomAsync(Guid userId)
    {
        const string sql = """
            SELECT
                room_id AS RoomId,
                COUNT(*)::INT AS UnreadCount
            FROM mention_notifications
            WHERE mentioned_user_id = @UserId
              AND read_at IS NULL
            GROUP BY room_id;
            """;

        using var connection = _context.CreateConnection();

        var rows = await connection.QueryAsync<UnreadMentionRow>(sql, new
        {
            UserId = userId
        });

        return rows.ToDictionary(x => x.RoomId, x => x.UnreadCount);
    }

    public async Task<IReadOnlyList<MentionNotificationItemResponse>> GetUnreadItemsAsync(
        Guid userId,
        int take)
    {
        const string sql = """
            SELECT
                mn.id,
                mn.room_id AS RoomId,
                r.name AS RoomName,
                mn.chat_message_id AS ChatMessageId,
                mn.source_user_id AS SourceUserId,
                mn.source_display_name AS SourceDisplayName,
                mn.source_username AS SourceUsername,
                COALESCE(mn.preview_text, '') AS PreviewText,
                mn.created_at AS CreatedAt,
                mn.read_at AS ReadAt
            FROM mention_notifications mn
            INNER JOIN rooms r
                ON r.id = mn.room_id
            WHERE mn.mentioned_user_id = @UserId
              AND mn.read_at IS NULL
            ORDER BY mn.created_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();

        var rows = await connection.QueryAsync<MentionNotificationItemResponse>(sql, new
        {
            UserId = userId,
            Take = take
        });

        return rows.ToList();
    }

    public async Task MarkRoomAsReadAsync(Guid roomId, Guid userId, DateTime readAtUtc)
    {
        const string sql = """
            UPDATE mention_notifications
            SET read_at = @ReadAtUtc
            WHERE room_id = @RoomId
              AND mentioned_user_id = @UserId
              AND read_at IS NULL;
            """;

        using var connection = _context.CreateConnection();

        await connection.ExecuteAsync(sql, new
        {
            RoomId = roomId,
            UserId = userId,
            ReadAtUtc = readAtUtc
        });
    }

    public async Task MarkMessageAsReadAsync(Guid chatMessageId, Guid userId, DateTime readAtUtc)
    {
        const string sql = """
            UPDATE mention_notifications
            SET read_at = @ReadAtUtc
            WHERE chat_message_id = @ChatMessageId
              AND mentioned_user_id = @UserId
              AND read_at IS NULL;
            """;

        using var connection = _context.CreateConnection();

        await connection.ExecuteAsync(sql, new
        {
            ChatMessageId = chatMessageId,
            UserId = userId,
            ReadAtUtc = readAtUtc
        });
    }

    private sealed class UnreadMentionRow
    {
        public Guid RoomId { get; set; }
        public int UnreadCount { get; set; }
    }
}