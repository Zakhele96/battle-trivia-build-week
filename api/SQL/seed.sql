-- ============================================
-- PHASE 2 - BATTLE TRIVIA SQL
-- PostgreSQL
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. TRIVIA QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS trivia_questions (
    id UUID PRIMARY KEY,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    accepted_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    category VARCHAR(50),
    difficulty VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_trivia_questions_accepted_answers_array
        CHECK (jsonb_typeof(accepted_answers) = 'array')
);

CREATE INDEX IF NOT EXISTS ix_trivia_questions_is_active
    ON trivia_questions(is_active);

CREATE INDEX IF NOT EXISTS ix_trivia_questions_category
    ON trivia_questions(category);

-- ============================================
-- 2. TRIVIA GAME SESSIONS
-- One active session per room at a time
-- ============================================
CREATE TABLE IF NOT EXISTS trivia_game_sessions (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP NULL,

    CONSTRAINT ck_trivia_game_sessions_status
        CHECK (status IN ('active', 'ended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_game_sessions_one_active_per_room
    ON trivia_game_sessions(room_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS ix_trivia_game_sessions_room_id
    ON trivia_game_sessions(room_id);

-- ============================================
-- 3. TRIVIA ROUNDS
-- One active round per session at a time
-- ============================================
CREATE TABLE IF NOT EXISTS trivia_rounds (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES trivia_game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES trivia_questions(id),
    round_number INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_trivia_rounds_status
        CHECK (status IN ('pending', 'active', 'ended')),

    CONSTRAINT ck_trivia_rounds_time_range
        CHECK (ends_at > started_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_rounds_session_round_number
    ON trivia_rounds(session_id, round_number);

CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_rounds_one_active_per_session
    ON trivia_rounds(session_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS ix_trivia_rounds_session_status
    ON trivia_rounds(session_id, status);

CREATE INDEX IF NOT EXISTS ix_trivia_rounds_question_id
    ON trivia_rounds(question_id);

-- ============================================
-- 4. TRIVIA ANSWERS
-- Allows multiple submissions, but only one correct-scoring answer per user per round
-- ============================================
CREATE TABLE IF NOT EXISTS trivia_answers (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL REFERENCES trivia_rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    normalized_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    correct_rank INT NULL,
    points_awarded INT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_trivia_answers_points_non_negative
        CHECK (points_awarded >= 0),

    CONSTRAINT ck_trivia_answers_rank_positive
        CHECK (correct_rank IS NULL OR correct_rank >= 1),

    CONSTRAINT ck_trivia_answers_correct_rank_consistency
        CHECK (
            (is_correct = TRUE AND correct_rank IS NOT NULL)
            OR
            (is_correct = FALSE AND correct_rank IS NULL)
        )
);

CREATE INDEX IF NOT EXISTS ix_trivia_answers_round_submitted_at
    ON trivia_answers(round_id, submitted_at);

CREATE INDEX IF NOT EXISTS ix_trivia_answers_user_id
    ON trivia_answers(user_id);

CREATE INDEX IF NOT EXISTS ix_trivia_answers_round_is_correct
    ON trivia_answers(round_id, is_correct);

-- Only one correct scoring submission per user per round
CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_answers_one_correct_per_user_per_round
    ON trivia_answers(round_id, user_id)
    WHERE is_correct = TRUE;

-- Helps prevent duplicate rank assignments in race conditions
CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_answers_round_correct_rank
    ON trivia_answers(round_id, correct_rank)
    WHERE correct_rank IS NOT NULL;

-- ============================================
-- 5. SCORE LEDGER
-- Source of truth for live session scores
-- ============================================
CREATE TABLE IF NOT EXISTS trivia_score_ledger (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES trivia_game_sessions(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES trivia_rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_trivia_score_ledger_points_positive
        CHECK (points > 0),

    CONSTRAINT ck_trivia_score_ledger_reason
        CHECK (reason IN ('correct_answer'))
);

CREATE INDEX IF NOT EXISTS ix_trivia_score_ledger_room_session_user
    ON trivia_score_ledger(room_id, session_id, user_id);

CREATE INDEX IF NOT EXISTS ix_trivia_score_ledger_round_id
    ON trivia_score_ledger(round_id);

CREATE INDEX IF NOT EXISTS ix_trivia_score_ledger_session_id
    ON trivia_score_ledger(session_id);

-- One score award per user per round
CREATE UNIQUE INDEX IF NOT EXISTS ux_trivia_score_ledger_one_score_per_user_per_round
    ON trivia_score_ledger(round_id, user_id);

-- ============================================
-- OPTIONAL: VIEW FOR LIVE LEADERBOARD
-- ============================================
CREATE OR REPLACE VIEW vw_trivia_session_leaderboard AS
SELECT
    tsl.room_id,
    tsl.session_id,
    tsl.user_id,
    u.username,
    u.display_name,
    SUM(tsl.points) AS total_points
FROM trivia_score_ledger tsl
INNER JOIN users u ON u.id = tsl.user_id
GROUP BY
    tsl.room_id,
    tsl.session_id,
    tsl.user_id,
    u.username,
    u.display_name;

-- ============================================
-- STARTER SEED QUESTIONS
-- accepted_answers should contain normalized accepted values
-- ============================================

INSERT INTO trivia_questions (
    id,
    question_text,
    correct_answer,
    accepted_answers,
    category,
    difficulty,
    is_active
)
VALUES
    (
        gen_random_uuid(),
        'What is the capital city of South Africa?',
        'Pretoria',
        '["pretoria"]'::jsonb,
        'General Knowledge',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'How many provinces are there in South Africa?',
        '9',
        '["9","nine"]'::jsonb,
        'South Africa',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which planet is known as the Red Planet?',
        'Mars',
        '["mars"]'::jsonb,
        'Science',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the largest ocean on Earth?',
        'Pacific Ocean',
        '["pacific ocean","pacific"]'::jsonb,
        'Geography',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Who wrote Romeo and Juliet?',
        'William Shakespeare',
        '["william shakespeare","shakespeare"]'::jsonb,
        'Literature',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the chemical symbol for water?',
        'H2O',
        '["h2o"]'::jsonb,
        'Science',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which country hosted the 2010 FIFA World Cup?',
        'South Africa',
        '["south africa"]'::jsonb,
        'Sports',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'How many days are in a leap year?',
        '366',
        '["366","three hundred and sixty six"]'::jsonb,
        'General Knowledge',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the square root of 64?',
        '8',
        '["8","eight"]'::jsonb,
        'Math',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which animal is known as the King of the Jungle?',
        'Lion',
        '["lion"]'::jsonb,
        'Animals',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which South African city is known as the Mother City?',
        'Cape Town',
        '["cape town"]'::jsonb,
        'South Africa',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the currency of South Africa?',
        'Rand',
        '["rand","south african rand"]'::jsonb,
        'South Africa',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Who painted the Mona Lisa?',
        'Leonardo da Vinci',
        '["leonardo da vinci","da vinci"]'::jsonb,
        'Art',
        'medium',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which continent is Egypt in?',
        'Africa',
        '["africa"]'::jsonb,
        'Geography',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'How many players are on a soccer team on the field at one time?',
        '11',
        '["11","eleven"]'::jsonb,
        'Sports',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which organ pumps blood through the human body?',
        'Heart',
        '["heart"]'::jsonb,
        'Science',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Who was the first President of democratic South Africa?',
        'Nelson Mandela',
        '["nelson mandela","mandela"]'::jsonb,
        'South Africa',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is 12 multiplied by 12?',
        '144',
        '["144","one hundred and forty four"]'::jsonb,
        'Math',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which gas do humans breathe in to survive?',
        'Oxygen',
        '["oxygen"]'::jsonb,
        'Science',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which country is famous for the pyramids of Giza?',
        'Egypt',
        '["egypt"]'::jsonb,
        'Geography',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What color do you get when you mix blue and yellow?',
        'Green',
        '["green"]'::jsonb,
        'General Knowledge',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'How many letters are in the English alphabet?',
        '26',
        '["26","twenty six"]'::jsonb,
        'General Knowledge',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which instrument has black and white keys?',
        'Piano',
        '["piano"]'::jsonb,
        'Music',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the freezing point of water in degrees Celsius?',
        '0',
        '["0","zero"]'::jsonb,
        'Science',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which bird is often associated with wisdom?',
        'Owl',
        '["owl"]'::jsonb,
        'Animals',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the name of South Africa''s national rugby team?',
        'Springboks',
        '["springboks","springboks rugby team","the springboks"]'::jsonb,
        'South Africa',
        'medium',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which metal is liquid at room temperature?',
        'Mercury',
        '["mercury"]'::jsonb,
        'Science',
        'medium',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the tallest animal in the world?',
        'Giraffe',
        '["giraffe"]'::jsonb,
        'Animals',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'Which month comes after September?',
        'October',
        '["october"]'::jsonb,
        'General Knowledge',
        'easy',
        TRUE
    ),
    (
        gen_random_uuid(),
        'What is the main language spoken in Brazil?',
        'Portuguese',
        '["portuguese"]'::jsonb,
        'Geography',
        'medium',
        TRUE
    )
ON CONFLICT DO NOTHING;

COMMIT;