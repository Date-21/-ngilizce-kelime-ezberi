-- VocabMaster Pro - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- This schema matches the JS client code exactly
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS everywhere

-- ============================================
-- CLEANUP: Drop existing indexes to prevent conflicts
-- ============================================
DROP INDEX IF EXISTS idx_words_level;
DROP INDEX IF EXISTS idx_level_progress_user;
DROP INDEX IF EXISTS idx_progress_user;
DROP INDEX IF EXISTS idx_progress_review;
DROP INDEX IF EXISTS idx_tests_user;
DROP INDEX IF EXISTS idx_tests_date;
DROP INDEX IF EXISTS idx_stats_user_date;
DROP INDEX IF EXISTS idx_badges_user;
DROP INDEX IF EXISTS idx_rooms_code;
DROP INDEX IF EXISTS idx_rooms_status;
DROP INDEX IF EXISTS idx_participants_room;
DROP INDEX IF EXISTS idx_game_history_user;
DROP INDEX IF EXISTS idx_posts_topic;
DROP INDEX IF EXISTS idx_posts_approved;
DROP INDEX IF EXISTS idx_posts_user;
DROP INDEX IF EXISTS idx_comments_post;
DROP INDEX IF EXISTS idx_messages_user;
DROP INDEX IF EXISTS idx_messages_read;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    total_points INTEGER DEFAULT 0,
    total_words_learned INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_study_date DATE,
    last_login TIMESTAMPTZ,
    username_changed_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEVELS
-- ============================================
CREATE TABLE IF NOT EXISTS levels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    order_index INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORDS
-- ============================================
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE,
    english_word TEXT NOT NULL,
    turkish_meaning TEXT NOT NULL,
    pronunciation TEXT DEFAULT '',
    memory_sentence TEXT DEFAULT '',
    example_sentence TEXT DEFAULT '',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_words_level ON words(level_id);

-- ============================================
-- USER LEVEL PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS user_level_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    current_word_index INTEGER DEFAULT 0,
    learned_words JSONB DEFAULT '[]',
    repeat_words JSONB DEFAULT '[]',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, level_id)
);

CREATE INDEX IF NOT EXISTS idx_level_progress_user ON user_level_progress(user_id);

-- ============================================
-- USER WORD PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS user_word_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    is_learned BOOLEAN DEFAULT FALSE,
    learned_at TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    next_review_date DATE,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_review ON user_word_progress(user_id, next_review_date);

-- ============================================
-- TRANSLATION SENTENCES
-- ============================================
CREATE TABLE IF NOT EXISTS translation_sentences (
    id SERIAL PRIMARY KEY,
    turkish_sentence TEXT NOT NULL,
    english_sentence TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEST RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    category TEXT,
    difficulty TEXT,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_date ON test_results(completed_at);

-- ============================================
-- DAILY STATS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    words_learned INTEGER DEFAULT 0,
    study_time INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    tests_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_stats_user_date ON daily_stats(user_id, date);

-- ============================================
-- BADGES (Definition Table)
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    condition_type TEXT NOT NULL, -- 'words_learned', 'streak', 'points', 'tests_completed'
    condition_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);

-- ============================================
-- STATS BACKUP (For undo reset functionality)
-- ============================================
CREATE TABLE IF NOT EXISTS stats_backup (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    backup_data JSONB NOT NULL,
    backed_up_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stats_backup_user ON stats_backup(user_id);

-- ============================================
-- GAME ROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS game_rooms (
    id SERIAL PRIMARY KEY,
    room_code TEXT UNIQUE NOT NULL,
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    level_start INTEGER,
    level_end INTEGER,
    category TEXT,
    question_count INTEGER DEFAULT 10,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    questions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON game_rooms(status);

-- ============================================
-- GAME PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS game_participants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    final_rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_room ON game_participants(room_id);

-- ============================================
-- GAME HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    room_code TEXT,
    category TEXT,
    question_count INTEGER,
    participant_count INTEGER,
    user_score INTEGER DEFAULT 0,
    user_rank INTEGER,
    played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id);

-- ============================================
-- FORUM TOPICS
-- ============================================
CREATE TABLE IF NOT EXISTS forum_topics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '💬',
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FORUM POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_topic ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_approved ON forum_posts(is_approved);
CREATE INDEX IF NOT EXISTS idx_posts_user ON forum_posts(user_id);

-- ============================================
-- FORUM COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS forum_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON forum_comments(post_id);

-- ============================================
-- SYSTEM MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS system_messages (
    id SERIAL PRIMARY KEY,
    from_admin UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON system_messages(to_user);
CREATE INDEX IF NOT EXISTS idx_messages_read ON system_messages(to_user, is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_messages ENABLE ROW LEVEL SECURITY;

-- Drop all policies first to allow re-run
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Users: everyone can read (including anon for username check), own insert/update, admin can update all
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "users_delete" ON users FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Levels & Words: readable by all, admin can manage
CREATE POLICY "levels_select" ON levels FOR SELECT USING (true);
CREATE POLICY "levels_admin" ON levels FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "words_select" ON words FOR SELECT USING (true);
CREATE POLICY "words_admin" ON words FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- User level progress: own data
CREATE POLICY "level_progress_select" ON user_level_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "level_progress_insert" ON user_level_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "level_progress_update" ON user_level_progress FOR UPDATE USING (auth.uid() = user_id);

-- User word progress: own data
CREATE POLICY "progress_select" ON user_word_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert" ON user_word_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON user_word_progress FOR UPDATE USING (auth.uid() = user_id);

-- Translation sentences: readable by all, admin can manage
CREATE POLICY "sentences_select" ON translation_sentences FOR SELECT USING (true);
CREATE POLICY "sentences_admin" ON translation_sentences FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Test results: own data
CREATE POLICY "tests_select" ON test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tests_insert" ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily stats: own data
CREATE POLICY "stats_select" ON daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stats_insert" ON daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats_update" ON daily_stats FOR UPDATE USING (auth.uid() = user_id);

-- Badges definition: readable by all, admin can manage
CREATE POLICY "badges_def_select" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_def_admin" ON badges FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- User Badges: own data
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stats Backup: own data
CREATE POLICY "stats_backup_select" ON stats_backup FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stats_backup_insert" ON stats_backup FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats_backup_delete" ON stats_backup FOR DELETE USING (auth.uid() = user_id);

-- Game rooms: all authenticated can read/write
CREATE POLICY "rooms_select" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON game_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rooms_update" ON game_rooms FOR UPDATE USING (true);
CREATE POLICY "rooms_delete" ON game_rooms FOR DELETE USING (
    host_user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Game participants: all authenticated
CREATE POLICY "participants_select" ON game_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON game_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "participants_update" ON game_participants FOR UPDATE USING (true);
CREATE POLICY "participants_delete" ON game_participants FOR DELETE USING (auth.uid() = user_id);

-- Game history: own data
CREATE POLICY "game_history_select" ON game_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "game_history_insert" ON game_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Forum topics: public read, admin manage
CREATE POLICY "topics_select" ON forum_topics FOR SELECT USING (true);
CREATE POLICY "topics_admin" ON forum_topics FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Forum posts: approved visible to all, own visible, admin sees all
CREATE POLICY "posts_select" ON forum_posts FOR SELECT USING (
    is_approved = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "posts_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON forum_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "posts_delete" ON forum_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Forum comments: same logic as posts
CREATE POLICY "comments_select" ON forum_comments FOR SELECT USING (
    is_approved = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "comments_insert" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON forum_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "comments_delete" ON forum_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- System messages: own messages, admin can insert
CREATE POLICY "messages_select" ON system_messages FOR SELECT USING (
    auth.uid() = to_user OR to_user IS NULL
);
CREATE POLICY "messages_update" ON system_messages FOR UPDATE USING (auth.uid() = to_user);
CREATE POLICY "messages_insert" ON system_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _username TEXT;
BEGIN
    _username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Ensure username uniqueness by appending random suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = _username AND id != NEW.id) LOOP
        _username := _username || '_' || floor(random() * 10000)::text;
    END LOOP;

    INSERT INTO public.users (id, username, email)
    VALUES (NEW.id, _username, NEW.email)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        last_login = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS game_rooms_updated_at ON game_rooms;
CREATE TRIGGER game_rooms_updated_at
    BEFORE UPDATE ON game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
    END IF;
END $$;

-- ============================================
-- SEED DATA: Default Forum Topics
-- ============================================
INSERT INTO forum_topics (name, description, icon)
SELECT * FROM (VALUES
    ('Genel Tartışma', 'Her konuda serbest tartışma alanı', '💬'),
    ('Kelime Önerileri', 'Yeni kelime ve içerik önerileri', '📝'),
    ('İpuçları & Stratejiler', 'Öğrenme ipuçları ve stratejileri paylaşın', '💡'),
    ('Hata Bildirimi', 'Uygulama hataları ve sorunlar', '🐛'),
    ('Başarı Hikayeleri', 'Başarılarınızı paylaşın', '🏆')
) AS v(name, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM forum_topics LIMIT 1);

-- ============================================
-- SEED DATA: Default Badges
-- ============================================
INSERT INTO badges (name, description, icon, condition_type, condition_value)
SELECT * FROM (VALUES
    ('İlk Adım', 'İlk kelimeni öğrendin!', '🌟', 'words_learned', 1),
    ('Kelime Avcısı', '10 kelime öğrendin', '📚', 'words_learned', 10),
    ('Kelime Ustası', '50 kelime öğrendin', '🎯', 'words_learned', 50),
    ('Kelime Şampiyonu', '100 kelime öğrendin', '🏆', 'words_learned', 100),
    ('Kelime Efsanesi', '500 kelime öğrendin', '👑', 'words_learned', 500),
    ('Düzenli Öğrenci', '3 gün üst üste çalıştın', '🔥', 'streak', 3),
    ('Kararlı Öğrenci', '7 gün üst üste çalıştın', '💪', 'streak', 7),
    ('Azimli Öğrenci', '30 gün üst üste çalıştın', '⚡', 'streak', 30),
    ('Puan Avcısı', '100 puan kazandın', '💎', 'points', 100),
    ('Puan Koleksiyoncusu', '500 puan kazandın', '💰', 'points', 500),
    ('Puan Milyoneri', '1000 puan kazandın', '🌈', 'points', 1000),
    ('Test Başlangıcı', 'İlk testini tamamladın', '✅', 'tests_completed', 1),
    ('Test Uzmanı', '10 test tamamladın', '📝', 'tests_completed', 10),
    ('Test Ustası', '50 test tamamladın', '🎓', 'tests_completed', 50)
) AS v(name, description, icon, condition_type, condition_value)
WHERE NOT EXISTS (SELECT 1 FROM badges LIMIT 1);

-- ============================================
-- MIGRATION: Add learned_words and completed_at columns
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_level_progress' AND column_name='learned_words') THEN
        ALTER TABLE user_level_progress ADD COLUMN learned_words JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_level_progress' AND column_name='completed_at') THEN
        ALTER TABLE user_level_progress ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================
-- NOTE: Admin User Creation
-- ============================================
-- Admin kullanıcısı oluşturmak için:
-- 1. Önce normal kayıt ile bir kullanıcı oluşturun
-- 2. Ardından aşağıdaki SQL'i çalıştırın (email'i değiştirin):
--
-- UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
--
-- VEYA username ile:
-- UPDATE users SET is_admin = true WHERE username = 'admin';
-- ============================================
