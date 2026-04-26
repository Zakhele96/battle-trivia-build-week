using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class UserPresenceRepository : IUserPresenceRepository
{
    private readonly DapperContext _context;

    public UserPresenceRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<DateTime?> GetLastSeenAtAsync(Guid userId)
    {
        const string sql = """
            SELECT last_seen_at
            FROM user_presence
            WHERE user_id = @UserId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<DateTime?>(sql, new { UserId = userId });
    }

    public async Task<IReadOnlyDictionary<Guid, DateTime?>> GetLastSeenAtManyAsync(IEnumerable<Guid> userIds)
    {
        var ids = userIds.Distinct().ToArray();
        if (ids.Length == 0)
            return new Dictionary<Guid, DateTime?>();

        const string sql = """
            SELECT
                user_id AS UserId,
                last_seen_at AS LastSeenAt
            FROM user_presence
            WHERE user_id = ANY(@UserIds);
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<PresenceRow>(sql, new { UserIds = ids });
        return rows.ToDictionary(row => row.UserId, row => row.LastSeenAt);
    }

    public async Task UpsertLastSeenAsync(Guid userId, DateTime lastSeenAtUtc)
    {
        const string sql = """
            INSERT INTO user_presence (
                user_id,
                last_seen_at,
                updated_at
            )
            VALUES (
                @UserId,
                @LastSeenAtUtc,
                @LastSeenAtUtc
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                last_seen_at = EXCLUDED.last_seen_at,
                updated_at = EXCLUDED.updated_at;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { UserId = userId, LastSeenAtUtc = lastSeenAtUtc });
    }

    private sealed class PresenceRow
    {
        public Guid UserId { get; set; }
        public DateTime? LastSeenAt { get; set; }
    }
}
