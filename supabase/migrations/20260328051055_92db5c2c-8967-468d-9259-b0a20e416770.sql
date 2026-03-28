
-- Chat games table
CREATE TABLE public.chat_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  game_type text NOT NULL, -- 'would_you_rather', 'compatibility_quiz', 'truth_prompt'
  game_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view games in their matches" ON public.chat_games
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = chat_games.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  ));

CREATE POLICY "Users can create games in their matches" ON public.chat_games
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = chat_games.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update games in their matches" ON public.chat_games
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = chat_games.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  ));

-- Enable realtime for chat_games
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_games;

-- Game questions table
CREATE TABLE public.game_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL,
  question_text text NOT NULL,
  options jsonb, -- null for truth_prompt
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game questions" ON public.game_questions
  FOR SELECT TO authenticated USING (true);
