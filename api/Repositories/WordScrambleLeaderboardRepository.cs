using Bts.Api.Data;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleLeaderboardRepository : IWordScrambleLeaderboardRepository
{
    private readonly DapperContext _context;

    public WordScrambleLeaderboardRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetSessionLeaderboardAsync(Guid sessionId, int take = 10)
    {
        const string sql = """
            SELECT
                l.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                SUM(l.points)::int AS Score,
                ROW_NUMBER() OVER (
                    ORDER BY SUM(l.points) DESC, u.display_name ASC, u.username ASC
                )::int AS Rank
            FROM word_scramble_score_ledger l
            INNER JOIN users u
                ON u.id = l.user_id
            WHERE l.session_id = @SessionId
            GROUP BY l.user_id, u.username, u.display_name
            ORDER BY Score DESC, u.display_name ASC, u.username ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<WordScrambleLeaderboardRowDto>(sql, new
        {
            SessionId = sessionId,
            Take = take
        });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetRoomLeaderboardAsync(Guid roomId, int take = 10)
    {
        const string sql = """
            SELECT
                l.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                SUM(l.points)::int AS Score,
                ROW_NUMBER() OVER (
                    ORDER BY SUM(l.points) DESC, u.display_name ASC, u.username ASC
                )::int AS Rank
            FROM word_scramble_score_ledger l
            INNER JOIN users u
                ON u.id = l.user_id
            WHERE l.room_id = @RoomId
            GROUP BY l.user_id, u.username, u.display_name
            ORDER BY Score DESC, u.display_name ASC, u.username ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<WordScrambleLeaderboardRowDto>(sql, new
        {
            RoomId = roomId,
            Take = take
        });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<WordScrambleLeaderboardRowDto>> GetGlobalLeaderboardAsync(int take = 10)
    {
        const string sql = """
            SELECT
                l.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                SUM(l.points)::int AS Score,
                ROW_NUMBER() OVER (
                    ORDER BY SUM(l.points) DESC, u.display_name ASC, u.username ASC
                )::int AS Rank
            FROM word_scramble_score_ledger l
            INNER JOIN users u
                ON u.id = l.user_id
            GROUP BY l.user_id, u.username, u.display_name
            ORDER BY Score DESC, u.display_name ASC, u.username ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<WordScrambleLeaderboardRowDto>(sql, new
        {
            Take = take
        });

        return rows.ToList();
    }
}