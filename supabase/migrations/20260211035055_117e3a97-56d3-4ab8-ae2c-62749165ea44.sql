
-- Add new columns to education_modules
ALTER TABLE education_modules ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'foundation';
ALTER TABLE education_modules ADD COLUMN IF NOT EXISTS badge_number INTEGER;
ALTER TABLE education_modules ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 20;
ALTER TABLE education_modules ADD COLUMN IF NOT EXISTS prerequisite_badges TEXT[] DEFAULT '{}';
ALTER TABLE education_modules ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;

-- Update existing 5 modules with tier metadata
UPDATE education_modules SET tier = 'foundation', is_optional = false, badge_number = 1 WHERE slug = 'consent-fundamentals';
UPDATE education_modules SET tier = 'foundation', is_optional = false, badge_number = 2 WHERE slug = 'enm-principles';
UPDATE education_modules SET tier = 'foundation', is_optional = false, badge_number = 3 WHERE slug = 'boundaries-communication';
UPDATE education_modules SET tier = 'foundation', is_optional = false, badge_number = 4 WHERE slug = 'safer-sex';
UPDATE education_modules SET tier = 'foundation', is_optional = false, badge_number = 5 WHERE slug = 'emotional-responsibility';

-- Create module_sections table
CREATE TABLE public.module_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES education_modules(id) ON DELETE CASCADE NOT NULL,
  section_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'article',
  content_text TEXT,
  content_url TEXT,
  estimated_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_module_sections_module ON module_sections(module_id);
ALTER TABLE module_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Module sections are viewable by everyone"
  ON module_sections FOR SELECT USING (true);

CREATE POLICY "Admins can insert module sections"
  ON module_sections FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update module sections"
  ON module_sections FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete module sections"
  ON module_sections FOR DELETE USING (is_admin(auth.uid()));

-- Create user_section_progress table
CREATE TABLE public.user_section_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section_id UUID REFERENCES module_sections(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

CREATE INDEX idx_section_progress_user ON user_section_progress(user_id);
CREATE INDEX idx_section_progress_section ON user_section_progress(section_id);
ALTER TABLE user_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own section progress"
  ON user_section_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own section progress"
  ON user_section_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own section progress"
  ON user_section_progress FOR UPDATE USING (auth.uid() = user_id);

-- Add attempt tracking to user_badges
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ DEFAULT NOW();

-- Insert 15 new education modules
-- Sexual Health Tier (6-9)
INSERT INTO education_modules (slug, title, description, content, tier, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional, order_index) VALUES
('understanding-desire', 'Understanding Desire', 'Explore the spectrum of sexual desire, libido differences, and how to navigate desire discrepancy in relationships.', '## Understanding Desire\n\nContent coming soon. This module will cover:\n\n- The spectrum of sexual desire\n- Libido differences between partners\n- Navigating desire discrepancy\n- Responsive vs spontaneous desire', 'sexual_health', 6, 25, ARRAY['consent-fundamentals', 'boundaries-communication'], false, true, 6),
('sexual-wellness-basics', 'Sexual Wellness Basics', 'Comprehensive, inclusive education on sexual anatomy, pleasure, and how bodies respond to arousal.', '## Sexual Wellness Basics\n\nContent coming soon. This module will cover:\n\n- Inclusive sexual anatomy\n- Understanding arousal responses\n- Body positivity and acceptance\n- Wellness practices', 'sexual_health', 7, 30, ARRAY['safer-sex'], false, true, 7),
('pleasure-satisfaction', 'Pleasure & Satisfaction', 'Learn about pleasure anatomy, exploration techniques, and cultivating satisfying intimate experiences.', '## Pleasure & Satisfaction\n\nContent coming soon. This module will cover:\n\n- Pleasure anatomy\n- Communication about pleasure\n- Exploration and discovery\n- Building satisfying experiences', 'sexual_health', 8, 25, ARRAY['sexual-wellness-basics'], false, true, 8),
('common-sexual-concerns', 'Common Sexual Concerns', 'Understanding common sexual difficulties, when they''re concerning, and when to seek professional support.', '## Common Sexual Concerns\n\nContent coming soon. This module will cover:\n\n- Common difficulties and challenges\n- When to seek help\n- Professional resources\n- Supporting partners', 'sexual_health', 9, 20, ARRAY['sexual-wellness-basics'], false, true, 9);

-- Identity & Diversity Tier (10-13)
INSERT INTO education_modules (slug, title, description, content, tier, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional, order_index) VALUES
('sexual-orientation-spectrum', 'Sexual Orientation Spectrum', 'Comprehensive understanding of LGBTQ+ identities, fluidity, and creating affirming relationships.', '## Sexual Orientation Spectrum\n\nContent coming soon. This module will cover:\n\n- Understanding LGBTQ+ identities\n- Sexual fluidity\n- Creating affirming spaces\n- Inclusive dating practices', 'identity', 10, 25, ARRAY['consent-fundamentals'], false, true, 10),
('gender-identity-expression', 'Gender Identity & Expression', 'Understanding gender diversity, supporting trans and non-binary partners, and inclusive dating practices.', '## Gender Identity & Expression\n\nContent coming soon. This module will cover:\n\n- Gender diversity beyond the binary\n- Supporting trans and non-binary partners\n- Inclusive language\n- Dating across gender identities', 'identity', 11, 25, ARRAY['sexual-orientation-spectrum'], false, true, 11),
('relationship-orientations', 'Relationship Orientations', 'Explore the full spectrum of relationship structures from monogamy to polyamory and everything in between.', '## Relationship Orientations\n\nContent coming soon. This module will cover:\n\n- Monogamy to polyamory spectrum\n- Relationship anarchy\n- Choosing your structure\n- Evolving relationships', 'identity', 12, 30, ARRAY['enm-principles'], false, true, 12),
('intersectionality-intimacy', 'Intersectionality in Intimacy', 'How race, culture, disability, religion, and other identities shape sexuality and relationships.', '## Intersectionality in Intimacy\n\nContent coming soon. This module will cover:\n\n- Race and sexuality\n- Cultural influences\n- Disability and intimacy\n- Religious backgrounds', 'identity', 13, 25, ARRAY['sexual-orientation-spectrum', 'gender-identity-expression'], false, true, 13);

-- Healthy Relationships Tier (14-17)
INSERT INTO education_modules (slug, title, description, content, tier, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional, order_index) VALUES
('relationship-skills-foundation', 'Relationship Skills Foundation', 'Core skills for building equitable, sustainable partnerships of any structure.', '## Relationship Skills Foundation\n\nContent coming soon. This module will cover:\n\n- Active listening skills\n- Equitable partnership practices\n- Sustainability in relationships\n- Building trust', 'relationships', 14, 30, ARRAY['boundaries-communication', 'emotional-responsibility'], false, true, 14),
('navigating-conflict', 'Navigating Conflict', 'Learn to handle disagreements constructively and strengthen relationships through repair.', '## Navigating Conflict\n\nContent coming soon. This module will cover:\n\n- Constructive disagreement\n- Repair after conflict\n- De-escalation techniques\n- Growth through challenge', 'relationships', 15, 25, ARRAY['relationship-skills-foundation'], false, true, 15),
('jealousy-insecurity', 'Jealousy & Insecurity', 'Understanding and managing jealousy, building security, and cultivating compersion.', '## Jealousy & Insecurity\n\nContent coming soon. This module will cover:\n\n- Understanding jealousy\n- Building security\n- Cultivating compersion\n- Self-soothing strategies', 'relationships', 16, 25, ARRAY['emotional-responsibility', 'enm-principles'], false, true, 16),
('maintaining-intimacy', 'Maintaining Long-term Intimacy', 'Strategies for keeping desire, connection, and intimacy alive in long-term relationships.', '## Maintaining Long-term Intimacy\n\nContent coming soon. This module will cover:\n\n- Keeping desire alive\n- Deepening connection\n- Novelty and routine balance\n- Intimacy beyond sex', 'relationships', 17, 25, ARRAY['relationship-skills-foundation', 'understanding-desire'], false, true, 17);

-- Advanced Topics Tier (18-20)
INSERT INTO education_modules (slug, title, description, content, tier, badge_number, estimated_minutes, prerequisite_badges, is_required, is_optional, order_index) VALUES
('advanced-enm-practices', 'Advanced ENM Practices', 'Deep dive into ENM structures, agreements, time management, and navigating multiple relationships.', '## Advanced ENM Practices\n\nContent coming soon. This module will cover:\n\n- Advanced ENM structures\n- Time management with multiple partners\n- Agreement crafting\n- Hierarchy and non-hierarchy', 'advanced', 18, 30, ARRAY['enm-principles', 'relationship-orientations', 'jealousy-insecurity'], false, true, 18),
('kink-bdsm-basics', 'Kink & BDSM Basics', 'Introduction to kink and BDSM with emphasis on consent, negotiation, and risk-aware practice.', '## Kink & BDSM Basics\n\nContent coming soon. This module will cover:\n\n- RACK and SSC frameworks\n- Negotiation skills\n- Safety practices\n- Aftercare essentials', 'advanced', 19, 25, ARRAY['consent-fundamentals', 'boundaries-communication'], false, true, 19),
('relationship-vision', 'Creating Your Relationship Vision', 'Integration course - design relationships intentionally using all previous learning.', '## Creating Your Relationship Vision\n\nContent coming soon. This module will cover:\n\n- Integrating all learning\n- Designing intentional relationships\n- Personal values mapping\n- Creating your vision', 'advanced', 20, 30, ARRAY['relationship-skills-foundation', 'advanced-enm-practices', 'navigating-conflict'], false, true, 20);
