-- ══════════════════════════════════════════════════════════════
--  PharmReady AlMaghawry — Supabase SAFE Setup / Repair Script
--  Works whether tables already exist or not.
--  Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════

-- 1. TRAINEES
CREATE TABLE IF NOT EXISTS trainees (
  id              bigserial PRIMARY KEY,
  created_at      timestamptz DEFAULT now(),
  name            text, age int, birth_year int,
  phone           text UNIQUE, whatsapp text, college text,
  squad           text, university text, training_branch text,
  target_level    text, security_answer text,
  email           text UNIQUE, password text,
  status          text DEFAULT 'pending',
  level           text DEFAULT 'Passengers',
  is_blocked      boolean DEFAULT false, notes text,
  external_form_status text DEFAULT 'لا',
  external_form_data   text
);
ALTER TABLE trainees DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS external_form_status text DEFAULT 'لا';
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS external_form_data text;

-- 2. ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id           bigserial PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  username     text UNIQUE NOT NULL,
  password     text NOT NULL,
  role         text DEFAULT 'Admin',
  permissions  text DEFAULT 'trainees,promotions,reports'
);
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions  text DEFAULT 'trainees,promotions,reports';

UPDATE admins SET display_name = 'د. أحمد فاضل',  role = 'Owner',      permissions = 'all'                         WHERE username = 'madmody';
UPDATE admins SET display_name = 'د. محمد لاشين', role = 'Supervisor', permissions = 'trainees,promotions,reports' WHERE username = 'lashin';

INSERT INTO admins (username, password, role, permissions, display_name) VALUES ('madmody', 'madmody', 'Owner', 'all', 'د. أحمد فاضل') ON CONFLICT (username) DO NOTHING;
INSERT INTO admins (username, password, role, permissions, display_name) VALUES ('lashin', 'lashin2026', 'Supervisor', 'trainees,promotions,reports', 'د. محمد لاشين') ON CONFLICT (username) DO NOTHING;

-- 3. VIDEOS
CREATE TABLE IF NOT EXISTS videos (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  video_id text UNIQUE, title text, level text, url text, description text
);
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS description text;

-- 4. COURSE PRICES
CREATE TABLE IF NOT EXISTS course_prices (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  level text UNIQUE NOT NULL, original_price numeric DEFAULT 0,
  offer_price numeric DEFAULT 0, is_free boolean DEFAULT false
);
ALTER TABLE course_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_prices ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;

INSERT INTO course_prices (level, original_price, offer_price, is_free) VALUES ('Passengers', 199, 149, false) ON CONFLICT (level) DO NOTHING;
INSERT INTO course_prices (level, original_price, offer_price, is_free) VALUES ('Starters',   299, 249, false) ON CONFLICT (level) DO NOTHING;
INSERT INTO course_prices (level, original_price, offer_price, is_free) VALUES ('Movers',     399, 349, false) ON CONFLICT (level) DO NOTHING;
INSERT INTO course_prices (level, original_price, offer_price, is_free) VALUES ('Flyers',     499, 449, false) ON CONFLICT (level) DO NOTHING;
INSERT INTO course_prices (level, original_price, offer_price, is_free) VALUES ('Beast',      599, 549, false) ON CONFLICT (level) DO NOTHING;

-- 5. PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  trainee_name text, trainee_email text, trainee_phone text,
  current_level text, target_level text,
  status text DEFAULT 'pending', notes text
);
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS notes text;

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  email text, message text, is_read boolean DEFAULT false
);
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 7. QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  level text, question_ar text, question_en text,
  option1_ar text, option1_en text, option2_ar text, option2_en text,
  option3_ar text, option3_en text, correct_index text
);
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- 8. PROGRESS
CREATE TABLE IF NOT EXISTS progress (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  email text UNIQUE, watched_videos text DEFAULT '',
  exam_passed boolean DEFAULT false, current_level text DEFAULT 'Passengers'
);
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS current_level text DEFAULT 'Passengers';

-- 9. REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  email text, trainee_name text, report_text text, report_type text,
  status text DEFAULT 'pending', admin_comment text
);
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_comment text;

-- SUCCESS: All tables ready. Platform fully operational.
