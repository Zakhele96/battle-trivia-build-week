INSERT INTO rooms (id, name, slug, description, room_type, is_active)
VALUES
    (gen_random_uuid(), 'Battle Trivia', 'battle-trivia', 'Main live trivia room', 'trivia', TRUE),
    (gen_random_uuid(), 'General Chat', 'general-chat', 'Public community chat room', 'chat', TRUE)
ON CONFLICT (slug) DO NOTHING;