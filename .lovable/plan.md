

## Plan: SHA/AASECT Foundation Tier Content Rewrite (Badges 1–5)

### Schema Migration: Fix `submit_quiz` and `award_badge` RPCs

Both RPCs currently count ALL `quiz_questions` for a module. With 7 total questions (5 badge + 2 checkpoint), users submitting 5 badge answers will get "Must answer all questions." Fix both to only count questions where `is_checkpoint = false` or `is_checkpoint IS NULL`.

### SHA/AASECT Content Standards (applied to ALL content)

- Sex-positive and pleasure-forward framing throughout
- Trauma-informed lens: no shaming language, normalize help-seeking
- Shame-reducing: "many people find..." not "you should..."
- Fully inclusive: all orientations, gender identities, bodies named
- Non-pathologizing: sexual variation is normal
- Reference named frameworks: FRIES, NVC, Gottman, Polysecure, Basson, Sheff CNM research, SHA/Midori KIC where applicable

**Disclaimer added to every module description:**
"Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care."

---

### Data Operations Per Module

For each of the 5 Foundation modules:
1. UPDATE `education_modules` SET description = [new] WHERE slug = [slug]
2. DELETE FROM `quiz_questions` WHERE module_id = (SELECT id...)
3. DELETE FROM `module_sections` WHERE module_id = (SELECT id...)
4. INSERT 4 `module_sections` — each with title, content_type='article', content_text (400–600 words, SHA-aligned), estimated_minutes (4 or 5), reflection_prompt
5. INSERT 7 `quiz_questions` — 5 badge (is_checkpoint=false), 2 checkpoint (is_checkpoint=true, position_in_section=1 or 2, linked to section_id of section 2 or 3). All scenario-based, application-focused, with explanation_correct and explanation_wrong (SHA non-shaming framing).

**No changes to:** tier names, badge_number, order_index, prerequisite_badges, is_required, is_optional, or any non-education schema.

---

### BADGE 1: `consent-fundamentals` — "Consent & Sexual Autonomy"

**Module description:** Learn the foundations of enthusiastic, ongoing consent using the research-backed FRIES model. Understand how consent works in ENM contexts and how to recognize and respond to violations with care and accountability. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "What Is Consent? The FRIES Model"**
- Content: Introduce FRIES model (Freely given, Reversible, Informed, Enthusiastic, Specific). Explain each element with real examples. Clarify consent is not just absence of "no" — it is the presence of genuine "yes." Trauma-informed framing: acknowledge many people were not taught this model growing up, learning it now is an act of care for themselves and their partners.
- Reflection: "Think about a time you communicated clearly about what you wanted or needed in a relationship. What made that feel possible? What made it difficult?"

**Section 2 — "Enthusiastic vs Coercive Consent"**
- Content: Explain the spectrum from enthusiastic to coercive — pressure, manipulation, intoxication, power imbalances. Clear examples without shaming. Emphasize coercion is never the receiver's fault. Validate that many people have experienced coercion without naming it — this recognition is healing, not shameful.
- Reflection: "What does enthusiastic consent look and feel like to you? How do you know when you — or someone with you — is truly enthusiastic?"

**Section 3 — "Consent in ENM and Multi-Partner Contexts"**
- Content: How consent works differently with multiple partners — ongoing renegotiation, metamour agreements, maintaining consistent consent across a network. Consent to one activity is not consent to all activities.
- Reflection: "How do you currently check in about consent with people you are intimate with? What is one thing you would like to do more consistently?"

**Section 4 — "Recognizing & Responding to Violations"**
- Content: How to recognize when consent may not have been present (your own or others'). How to respond when a violation occurs — with care, not shame. Community accountability vs punishment. Where to find support (RAINN, local resources).
- Reflection: "What does it mean to you to be part of a community that takes consent seriously? What role do you want to play in that?"

**Quiz Questions (7 total):**

Q1 (badge, order_index=0): "Jamie tells their partner 'I guess so' when asked about trying something new. According to the FRIES model, this response is concerning because consent should be..."
- Options: [A] Freely given ✓ [B] Only verbal [C] Given once [D] Always spontaneous
- explanation_correct: "Exactly — 'I guess so' suggests uncertainty or pressure, not a freely given yes. Freely given means no coercion or manipulation is influencing the response."
- explanation_wrong: "The FRIES model requires consent to be Freely given — meaning no pressure, manipulation, or obligation. 'I guess so' signals the person may not feel fully free to say no."

Q2 (badge, order_index=1): "A partner consented to an activity last week. This means..."
- Options: [A] They consent to it again this time [B] You should check in again ✓ [C] Consent is now established [D] Asking again is unnecessary
- explanation_correct: "Consent is Reversible — anyone can change their mind at any time. Checking in each time honors your partner's autonomy."
- explanation_wrong: "Consent is Reversible — the R in FRIES. Past consent does not carry forward. A warm check-in ('Still feeling good about this?') honors your partner's right to change their mind."

Q3 (checkpoint, is_checkpoint=true, position_in_section=1, linked to section 2): "Which scenario best describes Enthusiastic consent?"
- Options: [A] 'I suppose that's okay' [B] 'Yes, I really want to!' ✓ [C] Silence [D] 'If you want to'
- explanation_correct: "Yes! Enthusiasm means genuine excitement, not tolerance. Look for a clear positive signal."
- explanation_wrong: "Enthusiastic consent means a clear, genuine yes — not hesitation, uncertainty, or going along to avoid conflict."

Q4 (badge, order_index=2): Author — scenario about Informed consent (partner not disclosing relevant info before an activity). SHA-aligned.

Q5 (badge, order_index=3): Author — scenario about Specific consent (agreeing to one thing doesn't mean agreeing to everything). SHA-aligned.

Q6 (checkpoint, is_checkpoint=true, position_in_section=2, linked to section 3): Author — scenario about consent renegotiation in ENM/multi-partner context. SHA-aligned.

Q7 (badge, order_index=4): Author — scenario about responding to a consent violation with accountability vs shame. SHA-aligned.

---

### BADGE 2: `enm-principles` — Update title to "CNM Foundations"

**Frameworks:** Dr. Elisabeth Sheff's CNM research, Polysecure/Jessica Fern attachment styles, Multiamory RADAR system.

**Module description:** Explore the research-backed foundations of consensual non-monogamy through Dr. Elisabeth Sheff's longitudinal research. Learn about CNM structures, attachment in multi-partner relationships, and ethical practices that support thriving connections. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "What Is CNM? Sheff's Research"**
- Content: Define CNM using Dr. Elisabeth Sheff's longitudinal research. Differentiate CNM from cheating/infidelity. Present Sheff's findings on what makes CNM relationships thrive. Address common misconceptions with a non-pathologizing lens. Normalize CNM as a valid relationship orientation.
- Reflection: "What drew you to learning about consensual non-monogamy? What assumptions or beliefs are you bringing with you that you'd like to examine?"

**Section 2 — "CNM Structures & Styles"**
- Content: Overview of CNM structures: polyamory, relationship anarchy, swinging, open relationships, solo polyamory. Use Sheff's research to describe how different structures serve different needs. Emphasize no hierarchy of validity — each style is equally legitimate when practiced ethically. Include the Multiamory RADAR check-in system.
- Reflection: "Which CNM structure(s) resonate with you right now? What values or needs does that structure honor for you?"

**Section 3 — "Attachment in Multi-Partner Relationships"**
- Content: Introduce Jessica Fern's Polysecure framework — attachment theory applied to CNM. Explain secure, anxious, avoidant, and disorganized attachment in polyamorous contexts. The concept of "nested security" and how multiple attachments can be secure. How to build security across a polycule. Normalize attachment struggles.
- Reflection: "How does your attachment style show up in your relationships? What helps you feel secure, and what triggers feelings of insecurity?"

**Section 4 — "Ethical Practice & Norms"**
- Content: Community norms and ethics in CNM — transparency, honesty, harm reduction. Sheff's research on successful long-term CNM relationships. The difference between rules and agreements. How to navigate hierarchy, veto power, and couple privilege with awareness. Ethics of disclosure to new partners.
- Reflection: "What does 'ethical' mean to you in the context of your relationships? Where do you see room for growth in your own ethical practice?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using Sheff/Polysecure/RADAR frameworks. Author all 7 to same standard as Badge 1.

---

### BADGE 3: `boundaries-communication` — "Boundaries & NVC"

**Frameworks:** Marshall Rosenberg's Nonviolent Communication (NVC) 4-step model. Key distinction: boundaries protect self vs rules control others.

**Module description:** Master the art of setting and holding boundaries using Marshall Rosenberg's Nonviolent Communication framework. Learn the critical difference between boundaries that honor your needs and rules that control others, and practice communicating limits with clarity and compassion. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Boundaries as Self-Honoring"**
- Content: Define boundaries as acts of self-care, not punishment or control. Distinguish between boundaries (I will/won't) and rules (you must/can't). Why boundaries are essential in all relationships but especially in ENM. Trauma-informed framing: many people were taught that having boundaries is selfish — reframe as self-honoring. Types of boundaries: physical, emotional, sexual, time, digital.
- Reflection: "What boundaries do you hold most easily? Which ones are harder for you to set or maintain? What do you think makes the difference?"

**Section 2 — "Nonviolent Communication: The 4-Step Model"**
- Content: Introduce Marshall Rosenberg's NVC model: Observations (what happened, without judgment), Feelings (emotions, not thoughts), Needs (universal human needs), Requests (specific, actionable, negotiable). Provide examples in relationship/sexual contexts. Contrast NVC with common communication patterns (blame, criticism, stonewalling). Show how NVC supports consent conversations.
- Reflection: "Think of a recent conflict or misunderstanding. How might it have gone differently if you or the other person had used the NVC framework?"

**Section 3 — "Setting & Holding Boundaries in ENM"**
- Content: Unique boundary challenges in ENM: time management, sexual health agreements, emotional availability, metamour boundaries. How to set boundaries without issuing ultimatums. Renegotiating boundaries as relationships evolve. The concept of "soft" vs "hard" boundaries. Using NVC to communicate boundary changes.
- Reflection: "How do you currently communicate boundary changes to partners? What is one boundary you've been wanting to set but haven't yet? What's holding you back?"

**Section 4 — "Listening & Receiving Others' Limits"**
- Content: How to receive a partner's boundary without defensiveness. NVC empathic listening skills. Managing the emotional response when someone sets a limit with you. The difference between hearing a boundary and respecting one. How to ask for clarification without pressuring. Modeling graceful acceptance.
- Reflection: "How do you typically react when someone sets a boundary with you? What would it look like to receive boundaries with genuine curiosity and respect?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using NVC 4-step model and boundaries-vs-rules distinction. Author all 7 to same standard as Badge 1.

---

### BADGE 4: `safer-sex` — "Sexual Health & Harm Reduction"

**Frameworks:** Harm reduction model (NOT abstinence-only). Include PrEP/PEP, U=U (Undetectable=Untransmittable), fluid bonding agreements, inclusive anatomy language.

**Module description:** Approach sexual health through a harm reduction lens that empowers informed decision-making rather than fear. Learn about modern prevention tools including PrEP/PEP, understand U=U, navigate fluid bonding agreements, and build sexual health practices that work for all bodies. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Harm Reduction in Sexual Health"**
- Content: Define harm reduction philosophy — meeting people where they are, not demanding perfection. Contrast with abstinence-only framing. Why shame-based approaches don't work and actually increase risk. The spectrum of safer sex practices. Empowering people to make informed choices about their own bodies. Pleasure-positive framing: safer sex can enhance pleasure through trust and communication.
- Reflection: "What messages did you receive growing up about sexual health? How have those messages helped or hindered your ability to make informed decisions about your body?"

**Section 2 — "STI Prevention & Testing in ENM"**
- Content: Modern STI prevention landscape: barriers (internal/external condoms, dental dams), PrEP and PEP for HIV prevention, U=U (Undetectable = Untransmittable) and what it means. Testing recommendations for people with multiple partners. How to talk about testing with partners — scripts and examples. Destigmatizing STIs: they are health conditions, not moral judgments. Inclusive language for all bodies.
- Reflection: "What has your experience been with STI testing conversations? What would make those conversations feel easier or more natural for you?"

**Section 3 — "Fluid Bonding & Agreements"**
- Content: Define fluid bonding and why it matters in ENM. How to create clear, specific fluid bonding agreements. What to include: which barriers, with whom, under what circumstances. How agreements change when new partners enter. Renegotiation protocols. The emotional and practical dimensions of fluid bonding. Sample agreement frameworks.
- Reflection: "If you have (or were to have) a fluid bonding agreement, what would be most important to include? How would you handle a situation where the agreement needed to change?"

**Section 4 — "Inclusive Sexual Health for All Bodies"**
- Content: Sexual health beyond cisgender/heterosexual frameworks. Inclusive anatomy language (front hole, chest, etc. alongside clinical terms). Sexual health considerations for trans and nonbinary people. Pleasure and safety for people with disabilities. Age-inclusive sexual health. How systemic barriers affect sexual healthcare access for marginalized communities. Resources for inclusive healthcare providers.
- Reflection: "How does your own experience of your body shape your approach to sexual health? What would more inclusive sexual healthcare look like to you?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using harm reduction, PrEP/PEP, U=U, fluid bonding frameworks. Author all 7 to same standard as Badge 1.

---

### BADGE 5: `emotional-responsibility` — "Emotional Intelligence & Self-Regulation"

**Frameworks:** Goleman's 4 EQ domains, Gottman's emotional bids / turning toward, polyvagal theory basics (window of tolerance).

**Module description:** Build emotional intelligence using Goleman's EQ framework, learn to recognize and respond to emotional bids through Gottman's research, and understand your nervous system's role in relationships through polyvagal theory. Develop the self-regulation skills essential for healthy, multi-partner dynamics. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Emotional Intelligence Foundations"**
- Content: Introduce Daniel Goleman's 4 domains of emotional intelligence: self-awareness, self-management, social awareness, relationship management. Why EQ matters more than IQ in relationships. How emotional intelligence develops and can be strengthened at any age. Self-assessment: recognizing your own emotional patterns. Normalizing emotional struggles — EQ is a skill, not a trait.
- Reflection: "Which of Goleman's four EQ domains do you feel strongest in? Which one do you most want to develop? What does that tell you about yourself?"

**Section 2 — "Nervous System Regulation & the Window of Tolerance"**
- Content: Introduce polyvagal theory basics — the three states: ventral vagal (safe/social), sympathetic (fight/flight), dorsal vagal (freeze/shutdown). The "window of tolerance" concept. How to recognize when you're outside your window. Co-regulation and self-regulation techniques. Why dysregulation is not a character flaw — it's your nervous system doing its job. Trauma-informed framing: many people's windows of tolerance were narrowed by early experiences.
- Reflection: "What does it feel like in your body when you're inside your window of tolerance? What are your early warning signs that you're moving outside of it?"

**Section 3 — "Emotional Bids & Turning Toward (Gottman)"**
- Content: Introduce John Gottman's research on emotional bids — the fundamental unit of emotional connection. Three responses to bids: turning toward, turning away, turning against. How small moments of turning toward build trust over time. Recognizing bids in everyday interactions. How bid-response patterns predict relationship success. Applying bid awareness in ENM: managing bids across multiple partners.
- Reflection: "Think about your most recent interactions with someone you care about. Can you identify any emotional bids — from them or from you? How were they received?"

**Section 4 — "Emotional Responsibility in ENM"**
- Content: Emotional responsibility vs emotional caretaking — owning your feelings without making others responsible for them. Managing jealousy, compersion, and NRE (new relationship energy) with self-awareness. How to process emotions before reacting. The skill of sitting with discomfort. When to seek support: therapy, community, self-care. Building an emotional support network across a polycule.
- Reflection: "What is your go-to response when you feel a difficult emotion like jealousy or insecurity? What would a more emotionally responsible response look like for you?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using Goleman EQ, Gottman bids, polyvagal/window of tolerance frameworks. Author all 7 to same standard as Badge 1.

---

### Execution Order

1. Schema migration: fix `submit_quiz` + `award_badge` RPCs
2. Badge 1 data operations (update module → delete quiz_questions → delete module_sections → insert 4 sections → insert 7 questions with checkpoint section_id links)
3. Badge 2 data operations (same pattern)
4. Badge 3 data operations (same pattern)
5. Badge 4 data operations (same pattern)
6. Badge 5 data operations (same pattern)

### Files Changed

| # | Type | Description |
|---|------|-------------|
| 1 | Migration | Fix `submit_quiz` and `award_badge` to exclude checkpoint questions |
| 2–6 | Insert tool (x5) | Data operations for each Foundation module |

No frontend code changes needed. No changes to tier names, badge_number, order_index, prerequisite_badges, is_required, is_optional, or any non-education schema.

