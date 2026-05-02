using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class RoomSchemaService
{
    private readonly DapperContext _context;

    public RoomSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            ALTER TABLE rooms
                ADD COLUMN IF NOT EXISTS battle_trivia_question_duration_seconds INT NOT NULL DEFAULT 20;

            ALTER TABLE rooms
                ADD COLUMN IF NOT EXISTS battle_trivia_reveal_delay_seconds INT NOT NULL DEFAULT 5;

            ALTER TABLE rooms
                ADD COLUMN IF NOT EXISTS word_scramble_round_duration_seconds INT NOT NULL DEFAULT 30;

            ALTER TABLE rooms
                ADD COLUMN IF NOT EXISTS word_scramble_reveal_duration_seconds INT NOT NULL DEFAULT 5;

            INSERT INTO rooms (
                id,
                name,
                slug,
                description,
                room_type,
                is_active
            )
            SELECT
                gen_random_uuid(),
                'RapNometry Arena',
                'rapnometry-arena',
                'Creative open mic battles for rap, poetry, spoken word, and community challenges.',
                'chat',
                FALSE
            WHERE NOT EXISTS (
                SELECT 1
                FROM rooms
                WHERE slug = 'rapnometry-arena'
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
