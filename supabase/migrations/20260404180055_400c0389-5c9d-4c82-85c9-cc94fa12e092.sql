-- ========================================
-- FEATURE 1: Group Chat
-- ========================================

CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  muted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'system', 'opening_move')),
  metadata JSONB DEFAULT '{}',
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see their group chats" ON group_chats FOR SELECT TO authenticated
  USING (id IN (SELECT group_id FROM group_chat_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create group chats" ON group_chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see group members" ON group_chat_members FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM group_chat_members gcm WHERE gcm.user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON group_chat_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR group_id IN (SELECT group_id FROM group_chat_members gcm WHERE gcm.user_id = auth.uid() AND gcm.role = 'admin'));
CREATE POLICY "Admins manage members" ON group_chat_members FOR UPDATE TO authenticated
  USING (group_id IN (SELECT group_id FROM group_chat_members gcm WHERE gcm.user_id = auth.uid() AND gcm.role = 'admin'));
CREATE POLICY "Members can leave or admins remove" ON group_chat_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR group_id IN (SELECT group_id FROM group_chat_members gcm WHERE gcm.user_id = auth.uid() AND gcm.role = 'admin'));

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see group messages" ON group_messages FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM group_chat_members WHERE user_id = auth.uid()));
CREATE POLICY "Members send group messages" ON group_messages FOR INSERT TO authenticated
  WITH CHECK (group_id IN (SELECT group_id FROM group_chat_members WHERE user_id = auth.uid()));

CREATE INDEX idx_group_messages_group ON group_messages(group_id, created_at DESC);
CREATE INDEX idx_group_members_user ON group_chat_members(user_id);
CREATE INDEX idx_group_members_group ON group_chat_members(group_id);

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- ========================================
-- FEATURE 2: Opening Moves
-- ========================================

CREATE TABLE IF NOT EXISTS opening_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('icebreaker', 'deep_dive', 'education', 'playful', 'boundary')),
  text TEXT NOT NULL,
  context_note TEXT,
  related_badge_slug TEXT,
  requires_education_tier INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE opening_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read opening moves" ON opening_moves FOR SELECT TO authenticated USING (is_active = true);

CREATE INDEX idx_opening_moves_category ON opening_moves(category);
CREATE INDEX idx_opening_moves_badge ON opening_moves(related_badge_slug);

-- ========================================
-- FEATURE 4: Face Verification
-- ========================================

CREATE TABLE IF NOT EXISTS face_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  selfie_url TEXT,
  pose_requested TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_face_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_verified_at TIMESTAMPTZ;

ALTER TABLE face_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own verifications" ON face_verifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_face_verifications_user ON face_verifications(user_id, status);