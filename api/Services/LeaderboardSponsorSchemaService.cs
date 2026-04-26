using Bts.Api.Data;
using Dapper;
using Npgsql;

namespace Bts.Api.Services;

public sealed class LeaderboardSponsorSchemaService
{
    private readonly DapperContext _context;

    public LeaderboardSponsorSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS leaderboard_sponsors (
                id UUID PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                leaderboard_mode VARCHAR(30) NOT NULL,
                sponsor_text VARCHAR(180) NOT NULL,
                description TEXT,
                website_url TEXT,
                badge_image_url TEXT,
                call_to_action_label VARCHAR(40),
                starts_at TIMESTAMP NOT NULL,
                ends_at TIMESTAMP NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                display_priority INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT ck_leaderboard_sponsors_mode
                    CHECK (leaderboard_mode IN ('combined', 'battle-trivia', 'word-scramble')),
                CONSTRAINT ck_leaderboard_sponsors_dates
                    CHECK (ends_at > starts_at)
            );

            CREATE INDEX IF NOT EXISTS ix_leaderboard_sponsors_mode_dates
            ON leaderboard_sponsors(leaderboard_mode, is_active, starts_at DESC, ends_at DESC);

            CREATE TABLE IF NOT EXISTS leaderboard_sponsor_placements (
                id UUID PRIMARY KEY,
                sponsor_id UUID NOT NULL REFERENCES leaderboard_sponsors(id) ON DELETE CASCADE,
                placement_key VARCHAR(40) NOT NULL,
                display_order INT NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT ck_leaderboard_sponsor_placements_key
                    CHECK (placement_key IN (
                        'leaderboard-header',
                        'leaderboard-podium',
                        'lobby-featured',
                        'lobby-standings',
                        'room-sidebar'
                    ))
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_leaderboard_sponsor_placements_unique
            ON leaderboard_sponsor_placements(sponsor_id, placement_key);
            """;

        await using var connection = (NpgsqlConnection)_context.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(sql);
    }
}
