
-- Profile Chapters
CREATE TABLE IF NOT EXISTS profile_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chapter_type TEXT NOT NULL
    CHECK (chapter_type IN (
      'my_story', 'looking_for', 'relationship_style',
      'deal_breakers', 'fun_facts', 'growth_areas', 'custom'
    )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  custom_icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profile_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public chapters visible" ON profile_chapters
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Users insert own chapters" ON profile_chapters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own chapters" ON profile_chapters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own chapters" ON profile_chapters
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_profile_chapters_user ON profile_chapters(user_id, display_order);

-- User Astrology
CREATE TABLE IF NOT EXISTS user_astrology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  sun_sign TEXT CHECK (sun_sign IN (
    'aries','taurus','gemini','cancer','leo','virgo',
    'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
  )),
  moon_sign TEXT CHECK (moon_sign IN (
    'aries','taurus','gemini','cancer','leo','virgo',
    'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
  )),
  rising_sign TEXT CHECK (rising_sign IN (
    'aries','taurus','gemini','cancer','leo','virgo',
    'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
  )),
  show_on_profile BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_astrology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public astrology visible" ON user_astrology
  FOR SELECT USING (show_on_profile = true OR auth.uid() = user_id);

CREATE POLICY "Users insert own astrology" ON user_astrology
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own astrology" ON user_astrology
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own astrology" ON user_astrology
  FOR DELETE USING (auth.uid() = user_id);
