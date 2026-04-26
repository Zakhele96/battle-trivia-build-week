using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class AchievementSchemaService
{
    private readonly DapperContext _context;

    public AchievementSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string schemaSql = """
            CREATE TABLE IF NOT EXISTS achievement_definitions (
                id UUID PRIMARY KEY,
                code VARCHAR(60) NOT NULL UNIQUE,
                name VARCHAR(120) NOT NULL,
                description TEXT NOT NULL,
                badge_label VARCHAR(60) NOT NULL,
                icon_key VARCHAR(40) NOT NULL,
                xp_reward INT NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS user_achievements (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                achievement_definition_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
                earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
                context_json JSONB NULL,
                CONSTRAINT ux_user_achievements_user_definition UNIQUE (user_id, achievement_definition_id)
            );

            CREATE TABLE IF NOT EXISTS user_progress (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                xp_total INT NOT NULL DEFAULT 0,
                level INT NOT NULL DEFAULT 1,
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
            """;

        const string seedSql = """
            INSERT INTO achievement_definitions (id, code, name, description, badge_label, icon_key, xp_reward, is_active, created_at)
            VALUES
                ('11111111-1111-1111-1111-111111111111', 'first_win', 'First Win', 'Finish first in a Battle Trivia session.', 'Winner', 'trophy', 150, TRUE, NOW()),
                ('22222222-2222-2222-2222-222222222222', 'top3_finish', 'Top 3 Finish', 'Finish in the top 3 of a Battle Trivia session.', 'Top 3', 'medal', 80, TRUE, NOW()),
                ('33333333-3333-3333-3333-333333333333', 'weekly_champion', 'Weekly Champion', 'Become the weekly Battle Trivia champion.', 'Champion', 'crown', 200, TRUE, NOW()),
                ('44444444-4444-4444-4444-444444444444', 'hot_streak_5', 'Hot Streak', 'Reach a best streak of 5.', 'Streak x5', 'flame', 60, TRUE, NOW()),
                ('55555555-5555-5555-5555-555555555555', 'fastest_answer', 'Lightning Answer', 'Get a fastest correct answer under 1.5 seconds.', 'Fastest', 'bolt', 70, TRUE, NOW()),
                ('66666666-6666-6666-6666-666666666666', 'correct_10', 'Getting Started', 'Reach 10 total correct answers.', '10 Correct', 'target', 40, TRUE, NOW()),
                ('77777777-7777-7777-7777-777777777777', 'correct_100', 'Century Club', 'Reach 100 total correct answers.', '100 Correct', 'star', 140, TRUE, NOW()),
                ('88888888-8888-8888-8888-888888888888', 'sessions_played_5', 'Regular Player', 'Play 5 completed Battle Trivia sessions.', '5 Sessions', 'calendar', 50, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999991', 'correct_250', 'Sharp Shooter', 'Reach 250 total correct answers.', '250 Correct', 'target', 220, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999992', 'correct_500', 'Answer Machine', 'Reach 500 total correct answers.', '500 Correct', 'star', 320, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999993', 'sessions_played_25', 'Seasoned Player', 'Play 25 completed Battle Trivia sessions.', '25 Sessions', 'calendar', 110, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999994', 'sessions_played_100', 'Daily Fixture', 'Play 100 completed Battle Trivia sessions.', '100 Sessions', 'calendar', 260, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999995', 'hot_streak_10', 'Scorching Run', 'Reach a best streak of 10.', 'Streak x10', 'flame', 130, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999996', 'hot_streak_20', 'Untouchable', 'Reach a best streak of 20.', 'Streak x20', 'flame', 260, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999997', 'weekly_champion_5', 'Crowned Again', 'Become weekly champion 5 times.', '5 Crowns', 'crown', 260, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999998', 'weekly_champion_10', 'Dynasty', 'Become weekly champion 10 times.', '10 Crowns', 'crown', 420, TRUE, NOW()),
                ('99999999-9999-9999-9999-999999999999', 'fastest_answer_1s', 'Flash Step', 'Get a fastest correct answer under 1 second.', 'Under 1s', 'bolt', 120, TRUE, NOW()),
                ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'top10_finish', 'Top 10 Push', 'Break into the top 10 of a Battle Trivia session.', 'Top 10', 'medal', 45, TRUE, NOW()),
                ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'rank_2_finish', 'So Close', 'Finish second in a Battle Trivia session.', 'Runner-up', 'medal', 95, TRUE, NOW())
            ON CONFLICT (id) DO UPDATE
            SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                badge_label = EXCLUDED.badge_label,
                icon_key = EXCLUDED.icon_key,
                xp_reward = EXCLUDED.xp_reward,
                is_active = EXCLUDED.is_active;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(schemaSql);
        await connection.ExecuteAsync(seedSql);
    }
}
