-- ========================================
-- FEATURE 1: Partner/Polycule Linking
-- ========================================

CREATE TABLE IF NOT EXISTS partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
  relationship_label TEXT DEFAULT 'Partner',
  visibility TEXT NOT NULL DEFAULT 'profile'
    CHECK (visibility IN ('profile', 'matches_only', 'private')),
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, partner_id),
  CHECK (requester_id != partner_id)
);

-- Enforce max 5 active links per user
CREATE OR REPLACE FUNCTION check_max_partner_links()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM partner_links
      WHERE (requester_id = NEW.requester_id OR partner_id = NEW.requester_id)
      AND status = 'accepted') >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 partner links allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_partner_links
  BEFORE INSERT ON partner_links
  FOR EACH ROW EXECUTE FUNCTION check_max_partner_links();

ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own partner links" ON partner_links
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = partner_id);

CREATE POLICY "Users create partner link requests" ON partner_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users update own partner links" ON partner_links
  FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_links_requester ON partner_links(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_links_partner ON partner_links(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_links_status ON partner_links(status);

-- ========================================
-- FEATURE 2: Desire/Kink Tags
-- ========================================

CREATE TABLE IF NOT EXISTS desire_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  label TEXT NOT NULL UNIQUE,
  emoji TEXT,
  description TEXT,
  requires_education_tier INTEGER DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_desires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  desire_id UUID NOT NULL REFERENCES desire_options(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'matches_only', 'private')),
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, desire_id)
);

ALTER TABLE desire_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active desires" ON desire_options
  FOR SELECT TO authenticated
  USING (is_active = true);

ALTER TABLE user_desires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own desires" ON user_desires
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public desires visible to authenticated" ON user_desires
  FOR SELECT TO authenticated
  USING (visibility = 'public');

CREATE INDEX IF NOT EXISTS idx_desire_options_category ON desire_options(category, display_order);
CREATE INDEX IF NOT EXISTS idx_desire_options_active ON desire_options(is_active);
CREATE INDEX IF NOT EXISTS idx_user_desires_user ON user_desires(user_id);
CREATE INDEX IF NOT EXISTS idx_user_desires_desire ON user_desires(desire_id);

-- ========================================
-- FEATURE 3: Incognito Mode
-- ========================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS incognito_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS incognito_updated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS incognito_exceptions UUID[] DEFAULT '{}';