using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class BattleItSchemaService
{
    private readonly DapperContext _context;

    public BattleItSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            ALTER TABLE trivia_questions
                ADD COLUMN IF NOT EXISTS origin VARCHAR(30) NOT NULL DEFAULT 'public';

            ALTER TABLE trivia_questions
                ADD COLUMN IF NOT EXISTS created_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;

            CREATE INDEX IF NOT EXISTS ix_trivia_questions_origin_active
                ON trivia_questions(origin, is_active);

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
                'Battle It',
                'battle-it',
                'Create a public, source-backed live trivia battle that players join by code.',
                'battle-it',
                TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM rooms WHERE slug = 'battle-it'
            );

            CREATE TABLE IF NOT EXISTS battle_it_sessions (
                id UUID PRIMARY KEY,
                room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
                creator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                game_session_id UUID NULL REFERENCES trivia_game_sessions(id) ON DELETE SET NULL,
                title VARCHAR(120) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'draft',
                source_type VARCHAR(20) NOT NULL,
                source_label VARCHAR(160),
                source_hash VARCHAR(64) NOT NULL,
                difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
                answer_mode VARCHAR(20) NOT NULL DEFAULT 'text',
                visibility VARCHAR(20) NOT NULL DEFAULT 'code-only',
                question_duration_seconds INT NOT NULL DEFAULT 20,
                reveal_delay_seconds INT NOT NULL DEFAULT 5,
                join_code VARCHAR(6),
                model VARCHAR(80) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                CONSTRAINT ck_battle_it_sessions_status
                    CHECK (status IN ('draft', 'lobby', 'active', 'completed', 'cancelled')),
                CONSTRAINT ck_battle_it_sessions_source_type
                    CHECK (source_type IN ('text', 'image', 'mixed')),
                CONSTRAINT ck_battle_it_sessions_answer_mode
                    CHECK (answer_mode IN ('text', 'multiple-choice')),
                CONSTRAINT ck_battle_it_sessions_visibility
                    CHECK (visibility IN ('code-only', 'public')),
                CONSTRAINT ck_battle_it_question_duration
                    CHECK (question_duration_seconds BETWEEN 10 AND 60),
                CONSTRAINT ck_battle_it_reveal_delay
                    CHECK (reveal_delay_seconds BETWEEN 3 AND 15)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_battle_it_one_open_session_per_room
                ON battle_it_sessions(room_id)
                WHERE status IN ('lobby', 'active');

            ALTER TABLE battle_it_sessions
                ADD COLUMN IF NOT EXISTS join_code VARCHAR(6);

            ALTER TABLE battle_it_sessions
                ADD COLUMN IF NOT EXISTS answer_mode VARCHAR(20) NOT NULL DEFAULT 'text';

            ALTER TABLE battle_it_sessions
                ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'code-only';

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'ck_battle_it_sessions_answer_mode'
                ) THEN
                    ALTER TABLE battle_it_sessions
                        ADD CONSTRAINT ck_battle_it_sessions_answer_mode
                        CHECK (answer_mode IN ('text', 'multiple-choice'));
                END IF;
            END $$;

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'ck_battle_it_sessions_visibility'
                ) THEN
                    ALTER TABLE battle_it_sessions
                        ADD CONSTRAINT ck_battle_it_sessions_visibility
                        CHECK (visibility IN ('code-only', 'public'));
                END IF;
            END $$;

            UPDATE battle_it_sessions
            SET join_code = LPAD(FLOOR(RANDOM() * 1000000)::INT::TEXT, 6, '0')
            WHERE join_code IS NULL
              AND status IN ('lobby', 'active');

            DROP INDEX IF EXISTS ux_battle_it_open_join_code;

            CREATE UNIQUE INDEX ux_battle_it_open_join_code
                ON battle_it_sessions(join_code)
                WHERE join_code IS NOT NULL AND status IN ('draft', 'lobby', 'active');

            CREATE INDEX IF NOT EXISTS ix_battle_it_sessions_creator_created
                ON battle_it_sessions(creator_user_id, created_at DESC);

            CREATE INDEX IF NOT EXISTS ix_battle_it_sessions_room_status
                ON battle_it_sessions(room_id, status, updated_at DESC);

            CREATE TABLE IF NOT EXISTS battle_it_session_questions (
                session_id UUID NOT NULL REFERENCES battle_it_sessions(id) ON DELETE CASCADE,
                question_id UUID NOT NULL REFERENCES trivia_questions(id),
                position INT NOT NULL,
                concept VARCHAR(160) NOT NULL,
                source_excerpt TEXT NOT NULL,
                answer_options JSONB NOT NULL DEFAULT '[]'::jsonb,
                PRIMARY KEY (session_id, question_id),
                CONSTRAINT ck_battle_it_question_position CHECK (position BETWEEN 1 AND 20)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_battle_it_session_question_position
                ON battle_it_session_questions(session_id, position);

            ALTER TABLE battle_it_session_questions
                ADD COLUMN IF NOT EXISTS answer_options JSONB NOT NULL DEFAULT '[]'::jsonb;

            CREATE TABLE IF NOT EXISTS battle_it_session_members (
                session_id UUID NOT NULL REFERENCES battle_it_sessions(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (session_id, user_id)
            );

            INSERT INTO battle_it_session_members (session_id, user_id, joined_at)
            SELECT id, creator_user_id, created_at
            FROM battle_it_sessions
            ON CONFLICT (session_id, user_id) DO NOTHING;

            CREATE INDEX IF NOT EXISTS ix_battle_it_session_members_user
                ON battle_it_session_members(user_id, joined_at DESC);
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
