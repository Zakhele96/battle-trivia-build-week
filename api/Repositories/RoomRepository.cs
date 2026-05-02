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
                   battle_trivia_question_duration_seconds AS BattleTriviaQuestionDurationSeconds,
                   battle_trivia_reveal_delay_seconds AS BattleTriviaRevealDelaySeconds,
                   battle_trivia_media_enabled AS BattleTriviaMediaEnabled,
                   word_scramble_round_duration_seconds AS WordScrambleRoundDurationSeconds,
                   word_scramble_reveal_duration_seconds AS WordScrambleRevealDurationSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE is_active = TRUE
            ORDER BY name;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QueryAsync<Room>(sql);
    }

    public async Task<IEnumerable<Room>> GetAllIncludingInactiveAsync()
    {
        const string sql = """
            SELECT id, name, slug, description,
                   room_type AS RoomType,
                   is_active AS IsActive,
                   slow_mode_seconds AS SlowModeSeconds,
                   battle_trivia_question_duration_seconds AS BattleTriviaQuestionDurationSeconds,
                   battle_trivia_reveal_delay_seconds AS BattleTriviaRevealDelaySeconds,
                   battle_trivia_media_enabled AS BattleTriviaMediaEnabled,
                   word_scramble_round_duration_seconds AS WordScrambleRoundDurationSeconds,
                   word_scramble_reveal_duration_seconds AS WordScrambleRevealDurationSeconds,
                   created_at AS CreatedAt
            FROM rooms
            ORDER BY is_active DESC, name;
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
                   battle_trivia_question_duration_seconds AS BattleTriviaQuestionDurationSeconds,
                   battle_trivia_reveal_delay_seconds AS BattleTriviaRevealDelaySeconds,
                   battle_trivia_media_enabled AS BattleTriviaMediaEnabled,
                   word_scramble_round_duration_seconds AS WordScrambleRoundDurationSeconds,
                   word_scramble_reveal_duration_seconds AS WordScrambleRevealDurationSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE id = @Id AND is_active = TRUE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Room>(sql, new { Id = id });
    }

    public async Task<Room?> GetByIdIncludingInactiveAsync(Guid id)
    {
        const string sql = """
            SELECT id, name, slug, description,
                   room_type AS RoomType,
                   is_active AS IsActive,
                   slow_mode_seconds AS SlowModeSeconds,
                   battle_trivia_question_duration_seconds AS BattleTriviaQuestionDurationSeconds,
                   battle_trivia_reveal_delay_seconds AS BattleTriviaRevealDelaySeconds,
                   battle_trivia_media_enabled AS BattleTriviaMediaEnabled,
                   word_scramble_round_duration_seconds AS WordScrambleRoundDurationSeconds,
                   word_scramble_reveal_duration_seconds AS WordScrambleRevealDurationSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE id = @Id
            LIMIT 1;
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
                   battle_trivia_question_duration_seconds AS BattleTriviaQuestionDurationSeconds,
                   battle_trivia_reveal_delay_seconds AS BattleTriviaRevealDelaySeconds,
                   battle_trivia_media_enabled AS BattleTriviaMediaEnabled,
                   word_scramble_round_duration_seconds AS WordScrambleRoundDurationSeconds,
                   word_scramble_reveal_duration_seconds AS WordScrambleRevealDurationSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE slug = @Slug AND is_active = TRUE
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Room>(sql, new { Slug = slug });
    }

    public async Task<Room?> GetBySlugIncludingInactiveAsync(string slug)
    {
        const string sql = """
            SELECT id, name, slug, description,
                   room_type AS RoomType,
                   is_active AS IsActive,
                   slow_mode_seconds AS SlowModeSeconds,
                   battle_trivia_question_duration_seconds AS BattleTriviaQuestionDurationSeconds,
                   battle_trivia_reveal_delay_seconds AS BattleTriviaRevealDelaySeconds,
                   battle_trivia_media_enabled AS BattleTriviaMediaEnabled,
                   word_scramble_round_duration_seconds AS WordScrambleRoundDurationSeconds,
                   word_scramble_reveal_duration_seconds AS WordScrambleRevealDurationSeconds,
                   created_at AS CreatedAt
            FROM rooms
            WHERE slug = @Slug
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Room>(sql, new { Slug = slug });
    }

    public async Task<Room> CreateAsync(Room room)
    {
        const string sql = """
            INSERT INTO rooms (
                id,
                name,
                slug,
                description,
                room_type,
                is_active,
                slow_mode_seconds,
                battle_trivia_question_duration_seconds,
                battle_trivia_reveal_delay_seconds,
                battle_trivia_media_enabled,
                word_scramble_round_duration_seconds,
                word_scramble_reveal_duration_seconds,
                created_at
            )
            VALUES (
                @Id,
                @Name,
                @Slug,
                @Description,
                @RoomType,
                @IsActive,
                @SlowModeSeconds,
                @BattleTriviaQuestionDurationSeconds,
                @BattleTriviaRevealDelaySeconds,
                @BattleTriviaMediaEnabled,
                @WordScrambleRoundDurationSeconds,
                @WordScrambleRevealDurationSeconds,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, room);
        return room;
    }

    public async Task SetActiveAsync(Guid roomId, bool isActive)
    {
        const string sql = """
            UPDATE rooms
            SET is_active = @IsActive
            WHERE id = @RoomId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoomId = roomId,
            IsActive = isActive
        });
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

    public async Task UpdateGameTimingAsync(
        Guid roomId,
        int? battleTriviaQuestionDurationSeconds = null,
        int? battleTriviaRevealDelaySeconds = null,
        bool? battleTriviaMediaEnabled = null,
        int? wordScrambleRoundDurationSeconds = null,
        int? wordScrambleRevealDurationSeconds = null)
    {
        const string sql = """
            UPDATE rooms
            SET battle_trivia_question_duration_seconds = COALESCE(@BattleTriviaQuestionDurationSeconds, battle_trivia_question_duration_seconds),
                battle_trivia_reveal_delay_seconds = COALESCE(@BattleTriviaRevealDelaySeconds, battle_trivia_reveal_delay_seconds),
                battle_trivia_media_enabled = COALESCE(@BattleTriviaMediaEnabled, battle_trivia_media_enabled),
                word_scramble_round_duration_seconds = COALESCE(@WordScrambleRoundDurationSeconds, word_scramble_round_duration_seconds),
                word_scramble_reveal_duration_seconds = COALESCE(@WordScrambleRevealDurationSeconds, word_scramble_reveal_duration_seconds)
            WHERE id = @RoomId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            RoomId = roomId,
            BattleTriviaQuestionDurationSeconds = battleTriviaQuestionDurationSeconds,
            BattleTriviaRevealDelaySeconds = battleTriviaRevealDelaySeconds,
            BattleTriviaMediaEnabled = battleTriviaMediaEnabled,
            WordScrambleRoundDurationSeconds = wordScrambleRoundDurationSeconds,
            WordScrambleRevealDurationSeconds = wordScrambleRevealDurationSeconds
        });
    }
}
