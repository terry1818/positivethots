
-- Education Scenarios
CREATE TABLE IF NOT EXISTS education_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES education_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scenario_slug TEXT NOT NULL UNIQUE,
  characters JSONB NOT NULL DEFAULT '[]',
  scenes JSONB NOT NULL DEFAULT '[]',
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  prerequisite_badges INTEGER[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE education_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read scenarios" ON education_scenarios FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_scenarios_module ON education_scenarios(module_id);

-- User Scenario Progress
CREATE TABLE IF NOT EXISTS user_scenario_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES education_scenarios(id) ON DELETE CASCADE,
  current_scene TEXT NOT NULL DEFAULT 'scene_1',
  choices_made JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);

ALTER TABLE user_scenario_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scenario progress" ON user_scenario_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scenario progress" ON user_scenario_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenario progress" ON user_scenario_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenario progress" ON user_scenario_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_scenario_progress_user ON user_scenario_progress(user_id);
CREATE INDEX idx_scenario_progress_completed ON user_scenario_progress(completed, completed_at DESC);

-- Weekly Sprints
CREATE TABLE IF NOT EXISTS weekly_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  league_tier TEXT NOT NULL DEFAULT 'bronze',
  max_participants INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_start, league_tier)
);

ALTER TABLE weekly_sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sprints" ON weekly_sprints FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_sprints_active ON weekly_sprints(is_active, week_start);

-- Sprint Participants
CREATE TABLE IF NOT EXISTS sprint_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES weekly_sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  scenarios_completed INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  promotion_zone BOOLEAN NOT NULL DEFAULT false,
  demotion_zone BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sprint_id, user_id)
);

ALTER TABLE sprint_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see sprint participants" ON sprint_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join sprints" ON sprint_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sprint data" ON sprint_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_sprint_participants_sprint ON sprint_participants(sprint_id, xp_earned DESC);
CREATE INDEX idx_sprint_participants_user ON sprint_participants(user_id);
CREATE INDEX idx_sprint_participants_rank ON sprint_participants(sprint_id, rank);

-- Community Challenges
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  goal_target INTEGER NOT NULL,
  current_progress INTEGER NOT NULL DEFAULT 0,
  reward_description TEXT NOT NULL,
  reward_icon TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenges" ON community_challenges FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_community_challenges_active ON community_challenges(is_active, ends_at);

-- Enable realtime for leaderboard and challenges
ALTER PUBLICATION supabase_realtime ADD TABLE sprint_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE community_challenges;
