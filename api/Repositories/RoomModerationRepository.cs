using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class RoomModerationRepository : IRoomModerationRepository
{
    private readonly DapperContext _context;

    public RoomModerationRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<RoomUserMute?> GetActiveMuteAsync(Guid roomId, Guid userId, DateTime nowUtc)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                user_id AS UserId,
                reason,
                muted_until AS MutedUntil,
                created_by_user_id AS CreatedByUserId,
                created_at AS CreatedAt
            FROM room_user_mutes
            WHERE room_id = @RoomId
              AND user_id = @UserId
              AND (muted_until IS NULL OR muted_until > @NowUtc)
            ORDER BY created_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<RoomUserMute>(sql, new
        {
            RoomId = roomId,
            UserId = userId,
            NowUtc = nowUtc
        });
    }

    public async Task UpsertMuteAsync(RoomUserMute mute)
    {
        const string deleteSql = """
            DELETE FROM room_user_mutes
            WHERE room_id = @RoomId
              AND user_id = @UserId;
            """;

        const string insertSql = """
            INSERT INTO room_user_mutes (
                id,
                room_id,
                user_id,
                reason,
                muted_until,
                created_by_user_id,
                created_at
            )
            VALUES (
                @Id,
                @RoomId,
                @UserId,
                @Reason,
                @MutedUntil,
                @CreatedByUserId,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        connection.Open();

        using var tx = connection.BeginTransaction();

        await connection.ExecuteAsync(deleteSql, new
        {
            mute.RoomId,
            mute.UserId
        }, tx);

        await connection.ExecuteAsync(insertSql, mute, tx);

        tx.Commit();
    }

    public async Task ClearMuteAsync(Guid roomId, Guid userId)
    {
        const string sql = """
            DELETE FROM room_user_mutes
            WHERE room_id = @RoomId
              AND user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoomId = roomId,
            UserId = userId
        });
    }

    public async Task AddActionAsync(RoomModerationAction action)
    {
        const string sql = """
            INSERT INTO room_moderation_actions (
                id,
                room_id,
                target_user_id,
                action_type,
                reason,
                created_by_user_id,
                created_at,
                expires_at,
                metadata_json
            )
            VALUES (
                @Id,
                @RoomId,
                @TargetUserId,
                @ActionType,
                @Reason,
                @CreatedByUserId,
                @CreatedAt,
                @ExpiresAt,
                @MetadataJson
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, action);
    }

    public async Task<IReadOnlyList<RoomModerationActionDto>> GetRecentActionsAsync(Guid roomId, int take = 20)
    {
        const string sql = """
            SELECT
                a.id AS Id,
                a.action_type AS ActionType,
                a.reason AS Reason,
                a.created_at AS CreatedAt,
                a.expires_at AS ExpiresAt,
                a.metadata_json AS MetadataJson,
                COALESCE(actor.display_name, actor.username, 'Unknown') AS CreatedByDisplayName,
                COALESCE(target.display_name, target.username, '') AS TargetDisplayName
            FROM room_moderation_actions a
            LEFT JOIN users actor
                ON actor.id = a.created_by_user_id
            LEFT JOIN users target
                ON target.id = a.target_user_id
            WHERE a.room_id = @RoomId
            ORDER BY a.created_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<RoomModerationActionDto>(sql, new
        {
            RoomId = roomId,
            Take = take
        });

        return rows.ToList();
    }
}