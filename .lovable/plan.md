

## Plan: SHA/AASECT Sexual Health Tier Content Rewrite (Badges 6–9)

### Overview

Rewrite 4 Sexual Health tier modules to match the same SHA/AASECT-aligned structure used in the Foundation tier: 4 sections per module (400–600 words each), 7 quiz questions (5 badge + 2 checkpoint), all with reflection prompts and scenario-based questions.

No schema migration needed — the `submit_quiz` and `award_badge` RPCs were already fixed in the Foundation tier work.

### Existing Module IDs

| Badge | Slug | ID | Current Sections | Current Questions |
|-------|------|----|-----------------|-------------------|
| 6 | `understanding-desire` | `45761928-429e-4988-a6b7-09fda090a560` | 5 | 20 |
| 7 | `sexual-wellness-basics` | `a4e5ede1-cb0f-48c0-9da8-f4d21778c5a8` | 5 | 20 |
| 8 | `pleasure-satisfaction` | `4146c8fe-eca9-42d2-89bf-6ad11b74b471` | 5 | 20 |
| 9 | `common-sexual-concerns` | `e9de9717-b4c1-4f67-b995-d4b4c2bdb807` | 5 | 20 |

No changes to: tier names, badge_number, order_index, prerequisite_badges, is_required, is_optional, or any non-education schema.

---

### Data Operations Per Module

1. UPDATE `education_modules` SET description, title WHERE slug = [slug]
2. DELETE FROM `quiz_questions` WHERE module_id = [id]
3. DELETE FROM `module_sections` WHERE module_id = [id]
4. INSERT 4 `module_sections` with SHA-aligned content + reflection prompts
5. INSERT 7 `quiz_questions` — 5 badge + 2 checkpoint (linked to section 2 and 3 IDs)

---

### BADGE 6: `understanding-desire` — "Understanding Desire"

**Frameworks:** Basson Responsive Desire Model, spontaneous vs responsive desire, Bancroft & Janssen Dual Control Model.

**Module description:** Explore the science of desire through Dr. Rosemary Basson's responsive desire model and the dual control model. Understand why desire works differently for different people, normalize the full spectrum of desire experiences, and build skills for nurturing desire in your relationships. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "The Science of Desire: Beyond Spontaneous"**
- Content: Challenge the cultural myth that "real" desire is always spontaneous. Introduce Dr. Rosemary Basson's circular model of responsive desire. Explain that responsive desire — where arousal often precedes desire — is equally normal and common. Normalize the full spectrum: some people experience mostly spontaneous desire, some mostly responsive, many a mix that changes over time. Trauma-informed framing: many people feel broken because their desire doesn't match cultural scripts — this is not brokenness, it's diversity.
- Reflection: "How would you describe your own experience of desire? Has it changed over time or across different relationships?"

**Section 2 — "The Dual Control Model: Accelerators & Brakes"**
- Content: Introduce Bancroft & Janssen's dual control model — the sexual excitation system (accelerators) and sexual inhibition system (brakes). Everyone has both, calibrated differently. Stress, body image, relationship tension, and context all affect the brake/accelerator balance. Why "just relax" doesn't work — you need to actively reduce brakes AND increase accelerators. Practical examples of common accelerators and brakes. Non-pathologizing framing: having sensitive brakes is protective, not dysfunctional.
- Reflection: "What are your strongest accelerators — the things that increase your desire? What are your most sensitive brakes — the things that reduce it?"

**Section 3 — "Desire in Relationships & ENM"**
- Content: How desire functions in long-term relationships — desire discrepancy is normal, not a sign of failure. NRE (new relationship energy) and how it affects desire across a polycule. Strategies for nurturing desire: novelty, anticipation, emotional connection, reducing pressure. The myth of "matching" desire levels. How to talk about desire differences without blame or shame. Basson's model applied to ENM: different partners may activate different desire patterns.
- Reflection: "How do you navigate differences in desire with partners? What has worked well, and what has been challenging?"

**Section 4 — "Cultivating Desire as Practice"**
- Content: Desire as something you cultivate, not just something that happens to you. Mindfulness and embodiment practices for connecting with desire. The role of context: creating environments that support desire. Scheduling intimacy — not unromantic, but intentional. When low desire may warrant professional support — and how to find a sex-positive therapist (SHA referral language). Pleasure-forward framing: desire is about connection to yourself and others.
- Reflection: "What is one thing you could do this week to create more space for desire in your life — whether with a partner or on your own?"

**Quiz Questions (7 total):**

Q1 (badge, order_index=0): "Taylor rarely feels spontaneous desire but becomes very aroused once physical intimacy begins. According to Basson's model, Taylor is experiencing..."
- Options: [A] A sexual dysfunction [B] Responsive desire ✓ [C] Low libido [D] Performance anxiety
- explanation_correct: "Exactly — responsive desire means arousal often comes first, then desire follows. This is a completely normal pattern described by Dr. Basson's research."
- explanation_wrong: "Dr. Basson's responsive desire model describes this experience as normal — arousal often precedes desire. This is not dysfunction; it's simply how many people experience desire."

Q2 (badge, order_index=1): "According to the dual control model, someone who struggles with desire during stressful periods most likely has..."
- Options: [A] Weak accelerators [B] Sensitive brakes ✓ [C] A desire disorder [D] Incompatible partners
- explanation_correct: "Yes — the dual control model explains that stress activates the sexual inhibition system (brakes). Sensitive brakes are protective and normal, not a disorder."
- explanation_wrong: "The dual control model shows that stress activates our sexual inhibition system (brakes). Having sensitive brakes is a normal variation, not a disorder — it means reducing stressors is key."

Q3 (checkpoint, is_checkpoint=true, position_in_section=1, linked to section 2): "In the dual control model, which approach would be MOST effective for someone whose brakes are highly sensitive to stress?"
- Options: [A] Trying harder to feel aroused [B] Reducing stressors and creating safety ✓ [C] Ignoring the stress [D] Changing partners
- explanation_correct: "Right — when brakes are sensitive, the most effective approach is reducing what's pressing on them rather than pushing harder on the accelerator."
- explanation_wrong: "With sensitive brakes, pushing harder on accelerators won't help. The dual control model shows that reducing inhibitors (stressors) is more effective than increasing excitation."

Q4 (badge, order_index=2): Scenario about desire discrepancy in a relationship — normalizing different desire patterns, not assigning blame. SHA-aligned.

Q5 (badge, order_index=3): Scenario about NRE affecting desire across a polycule — applying Basson's model to ENM contexts. SHA-aligned.

Q6 (checkpoint, is_checkpoint=true, position_in_section=2, linked to section 3): Scenario about navigating desire differences with a partner using communication rather than pressure. SHA-aligned.

Q7 (badge, order_index=4): Scenario about when to seek professional support for desire concerns — using SHA referral language, non-pathologizing. SHA-aligned.

---

### BADGE 7: `sexual-wellness-basics` — "Sexual Wellness & Embodiment"

**Frameworks:** Inclusive anatomy education, arousal response cycle (updated from Masters & Johnson linear model to circular/non-linear models), body acceptance and embodiment.

**Module description:** Explore sexual wellness through inclusive anatomy education, understand arousal beyond linear models, and develop a compassionate relationship with your body. Learn how embodiment practices support sexual wellbeing for all bodies, identities, and experiences. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Inclusive Anatomy: All Bodies"**
- Content: Anatomy education using inclusive language — external and internal structures for all bodies. Use both clinical and community terms (e.g., "front hole" alongside "vagina," "chest" alongside "breasts"). Explain that anatomy varies widely and all variations are normal. Pleasure-relevant anatomy: the full clitoral structure, prostate, erogenous zones that vary by individual. Intersex variations as natural human diversity. Trauma-informed framing: many people received incomplete or shaming anatomy education.
- Reflection: "What was your experience learning about anatomy growing up? What would you want to know now that you didn't learn then?"

**Section 2 — "Arousal: Beyond the Linear Model"**
- Content: Move beyond Masters & Johnson's linear model (excitement → plateau → orgasm → resolution). Introduce circular and non-linear arousal models. Arousal non-concordance: when physical and mental arousal don't match — this is normal and common. The role of context, safety, and connection in arousal. Why orgasm is not the goal — pleasure and connection are. Inclusive framing: arousal looks different across bodies, ages, abilities, and medications.
- Reflection: "Have you ever experienced a disconnect between what your body was doing and how you felt mentally? How did you make sense of that experience?"

**Section 3 — "Body Acceptance & Embodiment"**
- Content: The relationship between body image and sexual wellbeing. How shame, comparison, and media messages affect sexual experience. Embodiment practices: body scanning, mindful touch, breathwork. Spectatoring — when you watch and judge yourself during intimacy instead of being present. Body acceptance is a practice, not a destination. Inclusive framing: all bodies are sexual bodies — disabled bodies, aging bodies, trans bodies, fat bodies, chronically ill bodies.
- Reflection: "How does your relationship with your body affect your sexual experiences? What would greater body acceptance look like for you?"

**Section 4 — "Building Your Wellness Practice"**
- Content: Sexual wellness as ongoing self-care, not a problem to solve. Integrating embodiment into daily life. Pelvic floor awareness (for all bodies). The role of sleep, stress management, and nutrition in sexual wellness. When to seek support: pelvic floor therapists, sex-positive therapists, inclusive healthcare providers. SHA referral language for professional support. Building a personal sexual wellness toolkit.
- Reflection: "What does sexual wellness mean to you personally? What is one small practice you could incorporate into your routine?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using inclusive anatomy, arousal non-concordance, body acceptance, and embodiment frameworks. Author all 7 to same standard as Badge 6.

---

### BADGE 8: `pleasure-satisfaction` — "Pleasure & Satisfaction"

**Frameworks:** Pleasure mapping, sensate focus (Masters & Johnson therapeutic technique), communication about pleasure, removal of performance pressure.

**Module description:** Reclaim pleasure as a central part of sexual wellbeing through pleasure mapping, sensate focus techniques, and skills for communicating about what feels good. Learn to release performance pressure and build satisfying intimate experiences centered on connection and enjoyment. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Redefining Pleasure: Beyond Performance"**
- Content: Challenge performance-oriented sexual scripts — orgasm as goal, penetration as "real sex," duration as measure of success. Redefine pleasure as any enjoyable sensory, emotional, or relational experience. The pleasure spectrum: from gentle touch to intense sensation, from solo to partnered, from physical to emotional. Why performance pressure kills pleasure. Normalizing diverse pleasure preferences. Pleasure-forward framing: everyone deserves pleasure on their own terms.
- Reflection: "What messages have you received about what 'good sex' looks like? How have those messages helped or limited your experience of pleasure?"

**Section 2 — "Pleasure Mapping & Self-Knowledge"**
- Content: Introduce pleasure mapping — a practice of exploring your own body to discover what feels good. How to create your own pleasure map: types of touch, pressure, speed, temperature, location. Why self-knowledge is the foundation of partnered pleasure. Solo exploration as a valid and valuable sexual experience. Normalizing vibrators and tools for all bodies. The concept of erotic blueprints or pleasure profiles (without rigid categorization). Shame-free framing: curiosity about your own body is healthy.
- Reflection: "How well do you know your own pleasure map? What areas of your body or types of sensation are you curious to explore?"

**Section 3 — "Sensate Focus & Mindful Touch"**
- Content: Introduce sensate focus — originally developed by Masters & Johnson as a therapeutic technique, now widely used for building intimacy. The progressive stages: non-genital touching → genital touching → mutual touching → optional intercourse. Why removing the "goal" paradoxically increases pleasure. How sensate focus builds presence, reduces anxiety, and deepens connection. Adapting sensate focus for ENM: using it with different partners. Accessibility: adapting for different bodies and abilities.
- Reflection: "How present are you typically during intimate experiences? What pulls you out of the moment, and what helps you stay connected?"

**Section 4 — "Communicating About Pleasure"**
- Content: Why talking about pleasure is hard — shame, vulnerability, fear of rejection. Communication tools: "I like when...", "More of...", "Let's try...", nonverbal signals. How to give and receive feedback without criticism. The ongoing conversation: pleasure preferences change over time. Navigating pleasure conversations in ENM: different partners, different preferences. Creating a culture of enthusiastic feedback. When pleasure concerns warrant professional support — SHA referral language.
- Reflection: "What makes it easy or difficult for you to communicate about pleasure with partners? What is one thing you wish you could express more freely?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using pleasure mapping, sensate focus, communication about pleasure, and performance pressure frameworks. Author all 7 to same standard as Badge 6.

---

### BADGE 9: `common-sexual-concerns` — "Common Sexual Concerns"

**Frameworks:** Non-pathologizing framework, lifespan sexuality, when to seek professional support, SHA referral language.

**Module description:** Explore common sexual concerns through a non-pathologizing lens that normalizes the full range of human sexual experience across the lifespan. Learn when and how to seek professional support, understand the difference between variation and dysfunction, and build compassion for yourself and your partners. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Normal Variation vs. Clinical Concern"**
- Content: The difference between sexual variation and sexual dysfunction — and why the line is not always clear. The biopsychosocial model: biological, psychological, and social factors all influence sexual function. Why "normal" is a spectrum, not a point. Common concerns that are actually normal variations: fluctuating desire, occasional difficulty with arousal or orgasm, changes with age or medications. When distress is the key indicator — if it bothers you, it's worth addressing. Non-pathologizing framing: your body is not broken.
- Reflection: "Have you ever worried that something about your sexual experience was 'abnormal'? How did that worry affect you?"

**Section 2 — "Lifespan Sexuality: Changes Are Normal"**
- Content: How sexuality changes across the lifespan — puberty, young adulthood, pregnancy/postpartum, perimenopause/menopause, aging. Hormonal changes and their effects on desire, arousal, and function. Medications that affect sexual function (antidepressants, blood pressure medications, hormonal contraceptives). Chronic illness, disability, and sexuality. Why changes don't mean loss — they mean adaptation. Pleasure remains possible at every stage. Inclusive framing: transgender hormone therapy and sexual changes.
- Reflection: "How has your sexuality changed over time? What has stayed the same, and what has shifted?"

**Section 3 — "Common Concerns & Compassionate Responses"**
- Content: Address specific common concerns without pathologizing: pain during sex (vaginismus/vulvodynia, prostatitis), erectile changes, difficulty with orgasm, rapid or delayed ejaculation, arousal difficulties, desire discrepancy. For each: normalize, explain possible contributing factors, offer initial self-help strategies. Emphasize that these are health concerns, not character flaws. The role of anxiety in creating and maintaining sexual difficulties. Compassionate self-talk and partner communication.
- Reflection: "If a partner shared a sexual concern with you, how would you want to respond? What kind of response would you want to receive if you shared a concern?"

**Section 4 — "When & How to Seek Professional Support"**
- Content: Signs that professional support would be helpful. Types of professionals: sex therapists (AASECT-certified), pelvic floor therapists, urologists, gynecologists, endocrinologists. How to find a sex-positive, kink-aware, ENM-affirming provider. What to expect in sex therapy — it's talk therapy, not physical. SHA referral language and resources. How to advocate for yourself in healthcare settings. Normalizing help-seeking: seeing a professional is an act of self-care, not a sign of failure.
- Reflection: "What would make it easier for you to seek professional support for a sexual concern? What barriers — internal or external — would you need to address?"

**Quiz Questions (7 total):** 5 badge + 2 checkpoint. All scenario-based using non-pathologizing framework, lifespan sexuality, biopsychosocial model, and SHA referral language. Author all 7 to same standard as Badge 6.

---

### Execution Order

1. Badge 6 data operations (update module → delete quiz_questions → delete module_sections → insert 4 sections → insert 7 questions with checkpoint section_id links)
2. Badge 7 data operations (same pattern)
3. Badge 8 data operations (same pattern)
4. Badge 9 data operations (same pattern)

### Files Changed

| # | Type | Description |
|---|------|-------------|
| 1–4 | Insert tool (x4) | Data operations for each Sexual Health module |

No schema migration needed. No frontend code changes. No changes to tier names, badge_number, order_index, prerequisite_badges, is_required, is_optional, or any non-education schema.

