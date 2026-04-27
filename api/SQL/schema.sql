CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    password_hash TEXT,
    google_sub TEXT,
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
    avatar_url TEXT,
    status_message VARCHAR(120),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_google_sub
ON users(google_sub)
WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    room_type VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'user',
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_sent_at
ON chat_messages(room_id, sent_at DESC);

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
