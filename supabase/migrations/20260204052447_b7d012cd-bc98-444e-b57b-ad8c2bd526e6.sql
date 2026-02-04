-- Add ENM-specific columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pronouns TEXT,
ADD COLUMN IF NOT EXISTS relationship_style TEXT,
ADD COLUMN IF NOT EXISTS relationship_status TEXT,
ADD COLUMN IF NOT EXISTS boundaries TEXT,
ADD COLUMN IF NOT EXISTS sti_status TEXT,
ADD COLUMN IF NOT EXISTS sti_last_tested DATE,
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'curious';

-- Create education_modules table
CREATE TABLE public.education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.education_modules(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create user badges table (tracking completed modules)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.education_modules(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quiz_score INTEGER,
  UNIQUE(user_id, module_id)
);

-- Create linked_profiles table for partner connections
CREATE TABLE public.linked_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'independent' CHECK (visibility IN ('always_together', 'sometimes_together', 'independent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.education_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_profiles ENABLE ROW LEVEL SECURITY;

-- Education modules are readable by all authenticated users
CREATE POLICY "Anyone can read education modules"
ON public.education_modules FOR SELECT
TO authenticated
USING (true);

-- Quiz questions are readable by all authenticated users
CREATE POLICY "Anyone can read quiz questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (true);

-- Users can read their own badges
CREATE POLICY "Users can read their own badges"
ON public.user_badges FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can read badges of other users (for profile display)
CREATE POLICY "Users can view all badges"
ON public.user_badges FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own badges
CREATE POLICY "Users can earn badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Linked profiles: users can see their own links
CREATE POLICY "Users can view their profile links"
ON public.linked_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Users can create link requests
CREATE POLICY "Users can create link requests"
ON public.linked_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update links they're involved in
CREATE POLICY "Users can update their profile links"
ON public.linked_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Users can delete their own link requests
CREATE POLICY "Users can delete their profile links"
ON public.linked_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Insert default education modules
INSERT INTO public.education_modules (slug, title, description, content, order_index, is_required) VALUES
('consent-fundamentals', 'Consent Fundamentals', 'Understanding enthusiastic consent and ongoing communication', 
'## What is Consent?

Consent is a clear, enthusiastic, ongoing agreement between all parties. It''s not just the absence of "no" — it''s the presence of "yes."

### The FRIES Model
- **Freely given**: No pressure, manipulation, or influence
- **Reversible**: Anyone can change their mind at any time
- **Informed**: Everyone understands what they''re agreeing to
- **Enthusiastic**: Look for genuine excitement, not just tolerance
- **Specific**: Saying yes to one thing doesn''t mean yes to everything

### Checking In
Consent isn''t a one-time checkbox. Check in regularly:
- "Is this still feeling good?"
- "Would you like to try something different?"
- "How are you feeling about this?"

### Recognizing Non-Consent
Watch for signs that someone may not be fully consenting:
- Hesitation or uncertainty
- Going along without enthusiasm
- Body language that doesn''t match words
- Silence (silence is NOT consent)', 1, true),

('enm-principles', 'ENM Principles', 'Core concepts of ethical non-monogamy', 
'## What is Ethical Non-Monogamy?

ENM encompasses relationship styles where all parties knowingly and consensually engage in romantic or sexual relationships with multiple people.

### Key Principles
1. **Honesty**: Complete transparency with all partners
2. **Communication**: Regular, open dialogue about needs and boundaries
3. **Consent**: All parties are informed and agreeing
4. **Respect**: Treating all relationships and partners with dignity

### Common ENM Styles
- **Polyamory**: Multiple loving relationships
- **Open relationships**: Primary partnership with outside connections
- **Swinging**: Recreational sexual experiences with others
- **Relationship anarchy**: Rejecting relationship hierarchy

### What ENM is NOT
- Cheating (which involves deception)
- A way to "fix" relationship problems
- Permission to ignore partner feelings
- One-sided arrangements', 2, true),

('boundaries-communication', 'Boundaries & Communication', 'Setting and respecting healthy boundaries', 
'## Boundaries in ENM

Boundaries are personal limits that help you feel safe and respected. They''re not rules to control others — they''re guidelines for your own wellbeing.

### Types of Boundaries
- **Physical**: What touch and intimacy you''re comfortable with
- **Emotional**: How much you share and with whom
- **Time**: How you allocate time between relationships
- **Sexual**: Safer sex practices, activities, exclusivities

### How to Set Boundaries
1. Know your own limits first
2. Communicate clearly and directly
3. Use "I" statements: "I need..." not "You must..."
4. Be specific about what you need
5. Revisit and adjust as needed

### Respecting Others'' Boundaries
- Ask before assuming
- Accept "no" gracefully
- Don''t push or negotiate against stated limits
- Thank people for communicating their needs', 3, true),

('safer-sex', 'Safer Sex Practices', 'Protection, testing, and sexual health in ENM', 
'## Safer Sex in ENM

With multiple partners, proactive sexual health is essential for everyone''s wellbeing.

### Barrier Methods
- Condoms (external and internal)
- Dental dams
- Gloves for manual stimulation

### Regular Testing
- Get tested every 3-6 months with multiple partners
- Test for: HIV, Syphilis, Gonorrhea, Chlamydia, HSV, HPV
- Share results openly with partners

### Disclosure
- Share your STI status with potential partners
- Discuss testing schedules and results
- Be honest about your sexual network

### Risk Reduction Strategies
- PrEP for HIV prevention
- Vaccinations (HPV, Hep A/B)
- Knowing your partners'' testing status
- Fluid bonding agreements', 4, true),

('emotional-responsibility', 'Emotional Responsibility', 'Managing feelings, jealousy, and aftercare', 
'## Emotional Labor in ENM

ENM requires significant emotional work. Understanding and managing feelings is crucial.

### Understanding Jealousy
Jealousy is normal and not inherently bad. It often signals:
- Unmet needs
- Insecurities to address
- Need for reassurance
- Boundary violations

### Compersion
The opposite of jealousy — feeling joy from your partner''s happiness with others. It''s not required, but can develop with practice.

### Aftercare
After intense experiences (dates, new relationships, difficult conversations):
- Check in with all partners
- Provide reassurance
- Process feelings together
- Allow time to reconnect

### Self-Care
- Maintain individual identity
- Keep personal support systems
- Practice stress management
- Know when to seek help', 5, true);

-- Insert quiz questions for each module
INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index) VALUES
((SELECT id FROM education_modules WHERE slug = 'consent-fundamentals'), 
 'Which best describes enthusiastic consent?', 
 '["The absence of \"no\"", "A clear, ongoing \"yes\" from all parties", "Assuming consent based on past experiences", "One-time agreement at the start"]', 
 1, 1),
((SELECT id FROM education_modules WHERE slug = 'consent-fundamentals'), 
 'When should you check in about consent?', 
 '["Only at the beginning", "Only if something changes", "Regularly throughout an experience", "Only if asked"]', 
 2, 2),

((SELECT id FROM education_modules WHERE slug = 'enm-principles'), 
 'What distinguishes ENM from cheating?', 
 '["The number of partners", "Whether you get caught", "Knowledge and consent of all involved", "How long relationships last"]', 
 2, 1),
((SELECT id FROM education_modules WHERE slug = 'enm-principles'), 
 'Which is a core principle of ENM?', 
 '["Secrecy", "Hierarchy", "Transparency", "Competition"]', 
 2, 2),

((SELECT id FROM education_modules WHERE slug = 'boundaries-communication'), 
 'Boundaries are best described as:', 
 '["Rules to control your partner", "Personal limits for your wellbeing", "Punishments for bad behavior", "Suggestions that can be ignored"]', 
 1, 1),
((SELECT id FROM education_modules WHERE slug = 'boundaries-communication'), 
 'How should you respond when someone states a boundary?', 
 '["Negotiate until they change their mind", "Accept it gracefully", "Ignore it if you disagree", "Test it to see if they mean it"]', 
 1, 2),

((SELECT id FROM education_modules WHERE slug = 'safer-sex'), 
 'How often should you get tested with multiple partners?', 
 '["Once a year", "Every 3-6 months", "Only if you have symptoms", "Never if using protection"]', 
 1, 1),
((SELECT id FROM education_modules WHERE slug = 'safer-sex'), 
 'What should you do about STI status?', 
 '["Keep it private", "Share openly with partners", "Only share if positive", "Only share if asked"]', 
 1, 2),

((SELECT id FROM education_modules WHERE slug = 'emotional-responsibility'), 
 'Jealousy in ENM often signals:', 
 '["That ENM isn''t for you", "Personal weakness", "Unmet needs or insecurities to address", "That your partner is doing something wrong"]', 
 2, 1),
((SELECT id FROM education_modules WHERE slug = 'emotional-responsibility'), 
 'What is compersion?', 
 '["Competitive comparison", "Joy from a partner''s happiness with others", "Suppressing jealousy", "Requiring equal time with all partners"]', 
 1, 2);