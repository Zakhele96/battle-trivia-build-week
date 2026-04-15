using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class RoomRepository : IRoomRepository
{
    private readonly DapperContext _context;

    public RoomRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Room>> GetAllAsync()
    {
        const string sql = """
            SELECT id, name, slug, description,
                   room_type AS RoomType,
                   is_active AS IsActive,
                   slow_mode_seconds AS SlowModeSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE is_active = TRUE
            ORDER BY name;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QueryAsync<Room>(sql);
    }

    public async Task<Room?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT id, name, slug, description,
                   room_type AS RoomType,
                   is_active AS IsActive,
                   slow_mode_seconds AS SlowModeSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE id = @Id AND is_active = TRUE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Room>(sql, new { Id = id });
    }

    public async Task<Room?> GetBySlugAsync(string slug)
    {
        const string sql = """
            SELECT id, name, slug, description,
                   room_type AS RoomType,
                   is_active AS IsActive,
                   slow_mode_seconds AS SlowModeSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE slug = @Slug AND is_active = TRUE
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Room>(sql, new { Slug = slug });
    }

    public async Task UpdateSlowModeAsync(Guid roomId, int slowModeSeconds)
    {
        const string sql = """
            UPDATE rooms
            SET slow_mode_seconds = @SlowModeSeconds
            WHERE id = @RoomId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoomId = roomId,
            SlowModeSeconds = slowModeSeconds
        });
    }
}