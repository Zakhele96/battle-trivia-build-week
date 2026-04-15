using Bts.Api.Data;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class MessageRepository : IMessageRepository
{
    private readonly DapperContext _context;

    public MessageRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(Guid id, Guid roomId, Guid? userId, string messageText, string messageType)
    {
        const string sql = """
            INSERT INTO chat_messages (id, room_id, user_id, message_text, message_type, sent_at)
            VALUES (@Id, @RoomId, @UserId, @MessageText, @MessageType, NOW());
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            RoomId = roomId,
            UserId = userId,
            MessageText = messageText,
            MessageType = messageType
        });
    }

    public async Task<IEnumerable<ChatMessageResponse>> GetRecentByRoomAsync(Guid roomId, int take)
    {
        const string sql = """
            SELECT
                m.id,
                m.room_id AS RoomId,
                m.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                COALESCE(u.is_admin, FALSE) AS IsAdmin,
                m.message_text AS MessageText,
                m.message_type AS MessageType,
                m.sent_at AS SentAt
            FROM chat_messages m
            LEFT JOIN users u ON u.id = m.user_id
            WHERE m.room_id = @RoomId
            ORDER BY m.sent_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ChatMessageResponse>(sql, new
        {
            RoomId = roomId,
            Take = take
        });

        return rows.Reverse();
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
}