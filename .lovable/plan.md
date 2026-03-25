

## Plan: SHA/AASECT Healthy Relationships Tier Content Rewrite (Badges 14–17)

### Overview

Rewrite 4 Healthy Relationships tier modules following the identical 4-section + 7-question structure. No schema migration needed.

### Existing Module IDs

| Badge | Slug | ID |
|-------|------|----|
| 14 | `relationship-skills-foundation` | `cc6fa5a2-791b-44a6-9a4a-f99dda8d1b4a` |
| 15 | `navigating-conflict` | `91623b0a-22a2-49b5-8767-625c4c999ebe` |
| 16 | `jealousy-insecurity` | `240253d3-b118-481a-a50c-55229a874c35` |
| 17 | `maintaining-intimacy` | `06b7a0a1-6936-4553-bfef-fd43e6fbd158` |

### Data Operations Per Module

Same pattern as previous tiers:
1. UPDATE `education_modules` SET title, description
2. DELETE FROM `quiz_questions` WHERE module_id = [id]
3. DELETE FROM `module_sections` WHERE module_id = [id]
4. INSERT 4 `module_sections` (400–600 words each, SHA-aligned, with reflection prompts)
5. Query new section IDs, then INSERT 7 `quiz_questions` (5 badge + 2 checkpoint linked to sections 2 and 3)

No changes to tier, badge_number, order_index, prerequisite_badges, is_required, is_optional.

---

### BADGE 14: `relationship-skills-foundation` — "Relationship Skills Foundation"

**Frameworks:** Gottman Sound Relationship House (SRH), Four Horsemen + antidotes, Love Maps.

**Module description:** Build a strong relationship foundation using the Gottman Institute's Sound Relationship House model. Learn to create detailed Love Maps, recognize and counter the Four Horsemen of relationship breakdown, and develop the skills that predict long-term relationship success. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "The Sound Relationship House"**
- Content: Introduce Gottman's Sound Relationship House — a research-based model built from studying thousands of couples. Seven levels: Love Maps (knowing your partner's world), Fondness & Admiration, Turning Toward, Positive Perspective, Managing Conflict, Making Life Dreams Come True, Creating Shared Meaning. Explain how each level builds on the previous. Apply to ENM: maintaining separate relationship houses with each partner, how strength in one relationship can model skills for others. Trauma-informed: many people didn't grow up seeing healthy relationship models — learning these skills now is powerful.
- Reflection: "Which level of the Sound Relationship House feels strongest in your current relationships? Which feels most in need of attention?"

**Section 2 — "Love Maps: Knowing Your Partner's World"**
- Content: Love Maps as the foundation — detailed knowledge of your partner's inner world: their worries, dreams, stressors, joys, history, and current concerns. Why Love Maps matter: Gottman's research shows couples with detailed Love Maps weather storms better. Love Map questions and exercises. How Love Maps change over time and need updating. Love Maps in ENM: maintaining current, detailed maps for multiple partners — the challenge of cognitive and emotional bandwidth. Love Maps as acts of care, not surveillance. Practical exercises for deepening Love Maps.
- Reflection: "How well do you know your partner(s)' inner world right now? What questions would you like to ask to deepen your understanding?"

**Section 3 — "The Four Horsemen & Their Antidotes"**
- Content: Gottman's Four Horsemen — the four communication patterns that predict relationship failure with over 90% accuracy: Criticism (attacking character, not behavior), Contempt (superiority, mockery, disgust — the single greatest predictor of divorce), Defensiveness (refusing responsibility), Stonewalling (emotional withdrawal/shutdown). The antidote for each: Criticism → Gentle Startup, Contempt → Build Culture of Appreciation, Defensiveness → Take Responsibility, Stonewalling → Physiological Self-Soothing. Real examples of each horseman and its antidote. How the Four Horsemen show up in ENM dynamics — across multiple relationships and in metamour interactions.
- Reflection: "Which of the Four Horsemen do you recognize most in your own communication patterns? What would practicing the antidote look like for you?"

**Section 4 — "Building a Culture of Appreciation"**
- Content: Gottman's research on the 5:1 ratio — successful relationships have at least 5 positive interactions for every negative one. How to build a culture of fondness and admiration. Small, consistent actions matter more than grand gestures. Expressing appreciation: specific, genuine, frequent. Turning Toward bids (connecting to Badge 5 content). How to maintain the 5:1 ratio across multiple ENM relationships — the compound challenge of emotional investment. When a relationship house needs professional repair — couples therapy with Gottman-trained therapists.
- Reflection: "What are three specific things you genuinely appreciate about your partner(s)? When was the last time you expressed that appreciation directly?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using Sound Relationship House, Love Maps, Four Horsemen/antidotes. Fully authored.

---

### BADGE 15: `navigating-conflict` — "Navigating Conflict"

**Frameworks:** Gottman perpetual vs solvable problems (69% perpetual), physiological flooding + self-soothing, repair attempts.

**Module description:** Transform your relationship to conflict using Gottman's research showing that 69% of relationship problems are perpetual. Learn to distinguish between solvable and perpetual problems, recognize physiological flooding, practice repair attempts, and develop the skills to navigate disagreements without damaging your connections. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Perpetual vs Solvable Problems"**
- Content: Gottman's groundbreaking finding: 69% of all relationship problems are perpetual — they will never be fully resolved. These stem from fundamental personality or value differences. Solvable problems are situational and can be resolved with good communication. The shift: from trying to solve everything to learning to dialogue about unsolvable differences with humor, affection, and acceptance. Gridlocked perpetual problems: when couples stop being able to discuss the issue at all. Dreams Within Conflict: Gottman's method for uncovering the deeper meanings behind positions. ENM-specific perpetual problems: time allocation, hierarchy disagreements, comfort with metamour involvement.
- Reflection: "Can you identify a perpetual problem in one of your relationships? How does it feel to consider that this issue may never be fully resolved — and that's okay?"

**Section 2 — "Physiological Flooding & Self-Soothing"**
- Content: What happens in your body during conflict — physiological flooding: heart rate above 100 BPM, stress hormones surge, prefrontal cortex goes offline. Why you can't have a productive conversation when flooded — your brain is in survival mode. Signs of flooding: tunnel vision, defensive posture, inability to listen, desire to fight or flee. The critical importance of taking breaks — at least 20 minutes for the body to return to baseline. Self-soothing techniques: deep breathing, progressive muscle relaxation, walking, grounding exercises. How to call a break without stonewalling: "I need 20 minutes to calm down, and then I want to continue this conversation." Flooding in ENM: jealousy-triggered flooding, conflict about metamour situations.
- Reflection: "What are your early warning signs that you're becoming physiologically flooded? What self-soothing practices work best for you?"

**Section 3 — "Repair Attempts: The Secret Weapon"**
- Content: Gottman's research identifies repair attempts as the single most important factor in predicting whether relationships thrive or fail. Repair attempts are any effort to de-escalate tension during conflict — humor, affection, acknowledgment, taking responsibility, expressing empathy. Examples: "I'm sorry, let me try again," "You're right about that part," "Can I have a do-over?", a gentle touch, a joke that breaks tension. Why repair attempts fail: when the emotional climate is too negative for repairs to land (the importance of maintaining a positive ratio). How to make your relationship more receptive to repairs. Repair attempts across ENM: using repairs in multi-partner conflicts, mediating between partners.
- Reflection: "What repair attempts do you naturally use during conflict? How well do you receive repair attempts from others?"

**Section 4 — "Conflict as Growth"**
- Content: Reframing conflict from threat to opportunity for deeper understanding. Softened startup: beginning difficult conversations gently rather than with criticism. The difference between complaint (specific behavior) and criticism (character attack). Active listening during conflict: reflecting back, validating emotions even when you disagree. Finding compromise on solvable problems. Accepting influence from your partner — Gottman's research shows this is essential. When conflict becomes harmful: recognizing abuse vs. normal conflict. When to seek professional support — Gottman-trained therapists, EFT (Emotionally Focused Therapy).
- Reflection: "Think about a recent conflict that went well. What made it productive? What would you want to repeat in future disagreements?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using perpetual/solvable problems, flooding/self-soothing, repair attempts. Fully authored.

---

### BADGE 16: `jealousy-insecurity` — "Jealousy & Insecurity"

**Frameworks:** Jessica Fern's Polysecure/HEARTS framework, jealousy as information, compersion cultivation, anxious/avoidant attachment in ENM.

**Module description:** Explore jealousy as valuable information rather than a problem to eliminate, using Jessica Fern's Polysecure HEARTS framework. Understand how attachment patterns show up in ENM, learn practical tools for building security across multiple relationships, and discover the path to compersion. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Jealousy as Information"**
- Content: Reframe jealousy from enemy to messenger — jealousy carries information about unmet needs, fears, and values. The anatomy of jealousy: identify the specific emotions underneath (fear of abandonment, fear of being replaced, fear of inadequacy, grief over lost time). Jealousy vs. envy (wanting what someone else has vs. fearing loss of what you have). Why suppressing jealousy doesn't work — and why acting on jealousy impulsively also doesn't work. The middle path: feeling jealousy fully, extracting its message, then choosing your response. Normalizing jealousy: even experienced ENM practitioners feel it. Shame about jealousy causes more damage than jealousy itself.
- Reflection: "Think about a time you felt jealous. What specific fear or need was underneath that feeling? What information was the jealousy trying to give you?"

**Section 2 — "The HEARTS Framework: Building Security"**
- Content: Introduce Jessica Fern's HEARTS framework from Polysecure — six practices for building secure attachment in CNM: Here (being present and attuned), Expressed Delight (showing joy in your partner), Attunement (tuning into emotional states), Rituals and Routines (consistent practices that build security), Turning Toward (responding to bids for connection), Security (creating a reliable base). How each HEARTS element specifically addresses jealousy and insecurity. Practical exercises for each element. Why security is built through small, consistent actions, not grand gestures. HEARTS across a polycule: maintaining these practices with multiple partners.
- Reflection: "Which elements of the HEARTS framework are strongest in your relationships? Which ones need more attention?"

**Section 3 — "Attachment Patterns in ENM"**
- Content: How anxious, avoidant, and disorganized attachment patterns manifest specifically in ENM contexts. Anxious attachment in ENM: hypervigilance about partner's other relationships, seeking constant reassurance, difficulty with partner's dates, protest behaviors. Avoidant attachment in ENM: using multiple relationships to maintain distance, difficulty with deep intimacy, withdrawing when partners need closeness. Disorganized attachment in ENM: oscillating between clinging and withdrawing. How ENM can either trigger attachment wounds or provide opportunities to develop earned secure attachment. The concept of "earned security" — building secure attachment through conscious practice regardless of early attachment experiences.
- Reflection: "How does your attachment pattern show up in your ENM relationships? What triggers your insecurities, and what helps you feel more secure?"

**Section 4 — "Cultivating Compersion"**
- Content: Define compersion — joy in a partner's joy with another. Compersion is not required, not a measure of ENM success, and not the opposite of jealousy (they can coexist). The path to compersion: it often develops naturally as security increases. Practices that support compersion: gratitude for metamour's positive impact on partner, focusing on abundance rather than scarcity, celebrating partner's growth. When compersion doesn't come — and that's okay. Managing NRE (new relationship energy) from both sides: as the person experiencing it and as the partner observing it. When insecurity warrants professional support — finding a poly-affirming therapist.
- Reflection: "Have you ever experienced compersion? If so, what conditions made it possible? If not, what do you think would need to be in place?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using HEARTS framework, jealousy-as-information, attachment in ENM, compersion. Fully authored.

---

### BADGE 17: `maintaining-intimacy` — "Maintaining Long-term Intimacy"

**Frameworks:** Gottman 6 hours/week model, intimacy beyond sex, scheduling with multiple partners, Sternberg's triangular theory of love.

**Module description:** Sustain deep intimacy across the lifespan of your relationships using Gottman's research-based rituals, Sternberg's triangular theory of love, and practical strategies for maintaining connection with multiple partners. Learn that intimacy is a practice, not a destination, and build sustainable rhythms of connection. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Sternberg's Triangular Theory of Love"**
- Content: Introduce Robert Sternberg's triangular theory: Intimacy (closeness, connectedness, bondedness), Passion (physical attraction, romantic feelings, sexual desire), and Commitment (decision to maintain the relationship). Seven types of love based on combinations: liking (intimacy alone), infatuation (passion alone), empty love (commitment alone), romantic love (intimacy + passion), companionate love (intimacy + commitment), fatuous love (passion + commitment), consummate love (all three). How each component naturally waxes and wanes over time. Why expecting all three at full intensity at all times is unrealistic. ENM application: different relationships may embody different love types, and that's valid — not every connection needs to be consummate love. Normalizing relationship evolution.
- Reflection: "Map your current relationship(s) on Sternberg's triangle. Which components are strongest? Which have shifted over time?"

**Section 2 — "Gottman's 6 Hours a Week"**
- Content: Gottman's research identifies specific daily and weekly rituals that maintain connection — totaling roughly 6 hours per week: Partings (learning about partner's day ahead — 2 min/day), Reunions (stress-reducing conversation — 20 min/day), Admiration & Appreciation (daily expressions), Affection (physical touch, kisses, holding), Weekly Date (2 hours of focused quality time), State of the Union meeting (1 hour weekly check-in about the relationship). Why these small rituals matter more than vacations or grand gestures. Adapting the 6-hour model for ENM: dividing intentional time across multiple partnerships, the math of multi-partner scheduling, quality over quantity. The danger of treating partners as tasks on a schedule — keeping intentionality without losing spontaneity.
- Reflection: "How much intentional connection time do you currently invest in your relationship(s) each week? What rituals do you already have, and what would you like to add?"

**Section 3 — "Intimacy Beyond Sex"**
- Content: The multiple dimensions of intimacy: emotional (sharing vulnerable feelings), intellectual (exchanging ideas and perspectives), experiential (shared activities and adventures), spiritual (shared values, meaning-making), physical non-sexual (touch, proximity, comfort), and sexual. Why over-emphasizing sexual intimacy creates fragile relationships. Building intimacy through everyday moments: cooking together, walking, sharing music, inside jokes, comfortable silence. How different partners may fulfill different intimacy needs — and why that's a feature of ENM, not a deficiency. Intimacy with yourself: self-intimacy as the foundation for relational intimacy. When intimacy decreases: natural ebb and flow vs. warning signs.
- Reflection: "Which dimensions of intimacy are most important to you? How do you currently nurture non-sexual intimacy with your partner(s)?"

**Section 4 — "Sustainable Rhythms of Connection"**
- Content: Long-term intimacy as a practice, not a feeling. Creating sustainable rhythms: calendar systems, regular check-ins, annual relationship reviews. The challenge of maintaining intimacy across multiple ENM relationships: practical scheduling tools, shared calendars, equitable time distribution. Avoiding burnout: recognizing when you're over-scheduled and under-connected. Intimacy during difficult periods: illness, grief, job stress, life transitions. How intimacy evolves across the lifespan of a relationship — from NRE intensity to deep, quiet knowing. When intimacy concerns warrant professional support — couples therapy, sex therapy, individual therapy. Sternberg's model applied: intentionally nurturing the component that needs attention.
- Reflection: "What sustainable practices do you want to build into your relationship(s) to maintain intimacy over the long term? What gets in the way?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using Sternberg's triangle, Gottman 6 hours/week, multi-dimensional intimacy, scheduling in ENM. Fully authored.

---

### Execution Order

1. Badge 14 data operations
2. Badge 15 data operations
3. Badge 16 data operations
4. Badge 17 data operations

### Technical Details

- Each module: UPDATE description → DELETE quiz_questions → DELETE module_sections → INSERT 4 sections → query section IDs → INSERT 7 questions with checkpoint links
- No schema migration needed
- No frontend changes
- No changes to tier, badge_number, order_index, prerequisite_badges

