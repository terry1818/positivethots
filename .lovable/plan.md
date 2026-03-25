

## Plan: SHA/AASECT Advanced Topics Tier Content Rewrite (Badges 18–20)

### Overview

Rewrite 3 Advanced Topics tier modules following the identical 4-section + 7-question structure. No schema migration needed.

### Existing Module IDs

| Badge | Slug | ID |
|-------|------|----|
| 18 | `advanced-enm-practices` | `39bbdb9d-3e2f-403a-b1b9-99a9ca4a5d3d` |
| 19 | `kink-bdsm-basics` | `bb479f48-718c-4e1a-bc4c-0847e0bd5ebc` |
| 20 | `relationship-vision` | `06c90640-bbf1-4502-a88b-db5626615e63` |

### Data Operations Per Module

Same pattern as all previous tiers:
1. UPDATE `education_modules` SET title, description
2. DELETE FROM `quiz_questions` WHERE module_id = [id]
3. DELETE FROM `module_sections` WHERE module_id = [id]
4. INSERT 4 `module_sections` (400–600 words each, SHA-aligned, with reflection prompts)
5. Query new section IDs, then INSERT 7 `quiz_questions` (5 badge + 2 checkpoint linked to sections 2 and 3)

No changes to tier, badge_number, order_index, prerequisite_badges, is_required, is_optional.

---

### BADGE 18: `advanced-enm-practices` — "Advanced ENM Practices"

**Frameworks:** Multiamory RADAR check-in system, agreements vs rules, hierarchy/non-hierarchy/solo poly, NRE management.

**Module description:** Deepen your ENM practice with advanced tools including the Multiamory RADAR check-in system, the critical distinction between agreements and rules, and nuanced navigation of hierarchy, non-hierarchy, and solo polyamory. Learn to manage NRE with wisdom and build sustainable multi-partner dynamics. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "The RADAR Check-in System"**
- Content: Introduce Multiamory's RADAR — a structured weekly/biweekly relationship check-in: Review (what's been happening), Agree (what's working), Discuss (concerns or changes), Action items (concrete next steps), Reconnect (close with affection/appreciation). Why structured check-ins prevent small issues from becoming big resentments. How to implement RADAR without it feeling clinical. Adapting RADAR for multiple partnerships — separate RADARs for each relationship. When to use RADAR vs spontaneous conversation. Trauma-informed: many people find structured communication safer than open-ended "we need to talk."
- Reflection: "How do you currently check in about the health of your relationships? What would a more structured approach offer you?"

**Section 2 — "Agreements vs Rules"**
- Content: The critical distinction: rules are imposed on a partner ("you can't do X"); agreements are collaboratively negotiated ("we've decided together that..."). Why this distinction matters ethically — rules center control, agreements center consent. How to convert existing rules into agreements. Common ENM rules that deserve reexamination: veto power, one penis/one vagina policies, don't-ask-don't-tell, ranking partners. The process of building agreements: identify needs, brainstorm options, negotiate, agree, schedule review. Agreements should be revisable — if an agreement no longer serves both parties, renegotiation is healthy. How broken agreements differ from broken rules — repair and accountability.
- Reflection: "Look at your current relationship agreements. Are any of them actually rules imposed by one person? How could you collaboratively renegotiate them?"

**Section 3 — "Hierarchy, Non-Hierarchy, & Solo Poly"**
- Content: Deep dive into structural approaches: Prescriptive hierarchy (predetermined limits on what secondary relationships can become) vs descriptive hierarchy (acknowledging that some relationships naturally have more entanglement without limiting others). Non-hierarchical polyamory: the commitment to not structurally limit any relationship's potential. Solo polyamory: maintaining individual autonomy as a core value — own home, finances, identity not merged with any partner. The ethics of each approach. Common pitfalls: couple privilege in hierarchical structures, idealism without practicality in non-hierarchical structures. How to choose and communicate your structural approach. Sheff's research on what works long-term.
- Reflection: "What structural approach resonates with you? What are the ethical considerations you need to navigate within that structure?"

**Section 4 — "NRE Management & Sustainable Practice"**
- Content: NRE (New Relationship Energy) deep dive: the neurochemistry (dopamine, oxytocin surges), typical timeline (6-18 months), and its effects on existing relationships. Managing NRE: maintaining commitments, not making major decisions during peak NRE, communicating with existing partners about the experience. Supporting a partner through NRE: managing your own reactions, asking for what you need, trusting the process. NRE as information — what it teaches about your desires and needs. When NRE fades: the transition from intensity to depth. Building sustainable ENM practice: energy management, avoiding relationship collector mentality, knowing your capacity. When to seek professional support for ENM challenges.
- Reflection: "How have you experienced NRE — either your own or a partner's? What strategies help you navigate that intensity without neglecting existing connections?"

**Quiz Questions (7 total):**

Q1 (badge, order_index=0): "In the Multiamory RADAR system, what does the 'A' in RADAR stand for?"
- Options: [A] Acknowledge [B] Agree ✓ [C] Apologize [D] Assess
- explanation_correct: "Yes — the 'A' stands for Agree, focusing on what's currently working well in the relationship. This positive anchoring creates safety before moving into discussion of concerns."
- explanation_wrong: "In RADAR, the 'A' stands for Agree — identifying what's working well. The full acronym is Review, Agree, Discuss, Action items, Reconnect."

Q2 (badge, order_index=1): "Sam tells their partner: 'You are not allowed to have sleepovers with anyone else.' According to ENM best practices, this is best described as..."
- Options: [A] A healthy boundary [B] A collaboratively built agreement [C] A rule imposed on a partner ✓ [D] Standard ENM practice
- Correct: 2
- explanation_correct: "This is a rule — imposed unilaterally rather than negotiated collaboratively. An agreement version might be: 'We've discussed it and agreed that for now, we'll both come home at night.'"
- explanation_wrong: "Unilateral dictates ('you are not allowed') are rules, not agreements. Agreements are collaboratively negotiated and center both partners' needs and consent."

Q3 (checkpoint, is_checkpoint=true, position_in_section=1, linked to section 2): "Jordan and Alex have a rule that neither can develop 'serious feelings' for other partners. A healthier approach using agreements would be..."
- Options: [A] Enforce the rule more strictly [B] Collaboratively discuss what each person needs to feel secure, and build flexible agreements around those needs ✓ [C] Abandon all structure entirely [D] Pretend feelings aren't developing
- Correct: 1
- explanation_correct: "Converting rules to agreements means identifying the underlying needs (security, prioritization) and collaboratively building flexible structures that honor those needs without controlling emotions."
- explanation_wrong: "Agreements-based practice identifies the needs behind rules (security, reassurance) and builds collaborative structures — rather than trying to control feelings."

Q4 (badge, order_index=2): Scenario about prescriptive vs descriptive hierarchy — recognizing couple privilege and its impact on secondary partners. SHA-aligned.

Q5 (badge, order_index=3): Scenario about a partner experiencing intense NRE — choosing a supportive, communicative response over reactive behavior. SHA-aligned.

Q6 (checkpoint, is_checkpoint=true, position_in_section=2, linked to section 3): Scenario about solo poly — recognizing it as a valid orientation rather than commitment avoidance. SHA-aligned.

Q7 (badge, order_index=4): Scenario about when to call a RADAR check-in vs when spontaneous conversation is more appropriate. SHA-aligned.

---

### BADGE 19: `kink-bdsm-basics` — "Kink & BDSM Foundations"

**Frameworks:** SHA KIC (Kink-Informed Care) / Midori framework — strength-based, nonjudgmental; RACK/SSC/PRICK consent frameworks; scene negotiation; aftercare; kink as identity vs activity; PSB (positive sexuality and behavior) framing from Dr. David Ley.

**Module description:** Explore kink and BDSM through the SHA Kink-Informed Care framework — a strength-based, nonjudgmental approach that honors kink as a valid expression of human sexuality. Learn consent frameworks (RACK, SSC, PRICK), scene negotiation, aftercare practices, and Dr. David Ley's ethical sexuality research. This module provides educational information only and is not instruction for practicing specific activities. Content informed by SHA/AASECT Kink-Informed Care framework. For educational purposes only — not a substitute for professional therapy, medical care, or in-person kink education from experienced practitioners.

**Section 1 — "Kink-Informed Care: A Strength-Based Approach"**
- Content: Introduce the SHA Kink-Informed Care (KIC) framework — developed to ensure that kink and BDSM are understood through a nonjudgmental, strength-based lens rather than pathologized. History of kink in the DSM: the important distinction between paraphilias (atypical interests) and paraphilic disorders (interests that cause distress or harm). Kink was depathologized in DSM-5 (2013). Dr. David Ley's Ethical Porn and Positive Sexuality and Behavior (PSB) research: kink practitioners often show higher relationship satisfaction, better communication, and greater psychological wellbeing. Kink as identity (an intrinsic part of who someone is) vs kink as activity (something someone enjoys doing) — both valid. Midori's framework: skill-based, consent-centered, emphasizing ongoing education. Non-shaming framing: exploring kink is a healthy expression of sexuality, not a sign of trauma or dysfunction.
- Reflection: "What messages have you received about kink — from culture, media, or community? How have those messages shaped your understanding of your own desires?"

**Section 2 — "Consent Frameworks: SSC, RACK, & PRICK"**
- Content: Three major consent frameworks used in kink communities: **SSC (Safe, Sane, Consensual)** — the oldest framework. Critiques: "safe" is relative, "sane" can be ableist. Still widely used as a baseline. **RACK (Risk-Aware Consensual Kink)** — acknowledges that no activity is completely safe, emphasizes informed risk assessment. Partners discuss specific risks and mitigation strategies. **PRICK (Personal Responsibility, Informed Consensual Kink)** — further emphasizes individual accountability for understanding risks. Comparing the frameworks: no single one is universally correct. Many practitioners combine elements from multiple frameworks. How these frameworks apply to different kink activities. The relationship between kink consent frameworks and the FRIES model from Badge 1. Why kink communities have often been ahead of mainstream culture in developing consent practices.
- Reflection: "Which consent framework resonates most with you and why? How does the concept of risk-awareness change the way you think about consent?"

**Section 3 — "Scene Negotiation & Communication"**
- Content: What a "scene" is — a planned kink interaction with defined parameters. The negotiation process: discussing desires, limits, and logistics before play begins. Key negotiation elements: activities (what's on the table), hard limits (absolute nos), soft limits (maybes with conditions), safewords (universal stop signals — red/yellow/green or custom words), signals for non-verbal communication (hand signals, dropping an object). Ongoing negotiation: consent doesn't end when the scene begins. Checking in during play. How to renegotiate mid-scene or stop a scene. The power of "no": in healthy kink dynamics, the bottom/submissive ultimately holds the most power through their ability to stop any activity at any time. Negotiation in ENM: kink dynamics across multiple partnerships — ensuring all affected parties are informed and consenting.
- Reflection: "How comfortable are you with explicit negotiation before intimate experiences? What would help you become more confident in stating your desires and limits?"

**Section 4 — "Aftercare & Ongoing Wellbeing"**
- Content: What aftercare is: the period of care, connection, and recovery following a kink scene. Why aftercare matters: intense physical or emotional experiences can trigger neurochemical shifts (endorphin/adrenaline comedown, subdrop, domdrop). Physical aftercare: hydration, warmth, wound care, rest. Emotional aftercare: verbal reassurance, physical closeness, affirmation, debriefing about the experience. Aftercare for all roles — tops/dominants need aftercare too (domdrop is real). Aftercare as ongoing: sometimes emotional processing continues for hours or days after a scene. When kink experiences bring up unexpected emotions — trauma responses, intense vulnerability, altered states. When to seek professional support: finding a kink-aware therapist (SHA/AASECT KIC directory). The importance of ongoing kink education — workshops, mentorship, community resources.
- Reflection: "What does aftercare mean to you — whether in kink contexts or in any intimate experience? How do you care for yourself and others after vulnerability?"

**Quiz Questions (7 total):**

Q1 (badge, order_index=0): "The DSM-5 (2013) made an important distinction regarding kink by..."
- Options: [A] Classifying all kink as a mental disorder [B] Distinguishing between paraphilias (atypical interests) and paraphilic disorders (interests causing distress or harm) ✓ [C] Removing all mention of sexual interests [D] Requiring therapy for all kink practitioners
- Correct: 1
- explanation_correct: "Yes — the DSM-5 distinguished between having an atypical interest (paraphilia, not a disorder) and having that interest cause significant distress or harm to others (paraphilic disorder). This was a major step in depathologizing kink."
- explanation_wrong: "The DSM-5's key distinction: atypical sexual interests (paraphilias) are not disorders. Only when they cause significant personal distress or harm to others are they classified as paraphilic disorders."

Q2 (badge, order_index=1): "RACK (Risk-Aware Consensual Kink) differs from SSC (Safe, Sane, Consensual) primarily by..."
- Options: [A] Being less focused on consent [B] Acknowledging that no activity is completely safe and emphasizing informed risk assessment ✓ [C] Requiring professional supervision [D] Only applying to experienced practitioners
- Correct: 1
- explanation_correct: "Exactly — RACK acknowledges that 'safe' is relative and replaces it with risk-awareness. Partners discuss specific risks and mitigation strategies rather than assuming safety."
- explanation_wrong: "RACK's key innovation is replacing 'safe' with 'risk-aware' — acknowledging that all activities carry some risk and emphasizing informed, explicit discussion of those risks and mitigation strategies."

Q3 (checkpoint, is_checkpoint=true, position_in_section=1, linked to section 2): "During a scene negotiation, a partner says they're interested in an activity but only under very specific conditions. This would be classified as..."
- Options: [A] A hard limit [B] A soft limit ✓ [C] A safeword [D] Aftercare
- Correct: 1
- explanation_correct: "Right — a soft limit is an activity someone is open to under specific conditions. It's a 'maybe with conditions' rather than an absolute no (hard limit)."
- explanation_wrong: "An activity someone is interested in but only under specific conditions is a soft limit — it's not an absolute no (hard limit) but requires particular circumstances to be acceptable."

Q4 (badge, order_index=2): Scenario about recognizing subdrop — emotional/physical comedown after a scene — and appropriate aftercare response. SHA KIC-aligned.

Q5 (badge, order_index=3): Scenario about Dr. David Ley's research — kink practitioners showing higher communication skills and relationship satisfaction, countering pathologizing narratives. SHA-aligned.

Q6 (checkpoint, is_checkpoint=true, position_in_section=2, linked to section 3): Scenario about mid-scene check-in and safeword use — honoring a partner's yellow/red signal immediately. SHA KIC-aligned.

Q7 (badge, order_index=4): Scenario about the difference between kink as identity vs activity — validating both without pathologizing either. SHA-aligned.

---

### BADGE 20: `relationship-vision` — "Creating Your Relationship Vision"

**Frameworks:** Integration module — personal relationship philosophy, SHA ongoing learning resources, AASECT provider referral, continuing growth.

**Module description:** Integrate everything you've learned into a personal relationship philosophy that reflects your values, desires, and growth. Explore SHA ongoing learning resources, learn how to find AASECT-certified providers, and build a vision for continuing growth in your relationships and sexual wellbeing. Content informed by SHA/AASECT framework. For educational purposes only — not a substitute for professional therapy or medical care.

**Section 1 — "Your Relationship Philosophy"**
- Content: Invite learners to synthesize everything they've explored across the curriculum into a personal relationship philosophy — a living document that articulates their values, needs, boundaries, and aspirations. Key questions: What are your core relationship values? (honesty, autonomy, security, growth, pleasure?) What relationship structure(s) align with those values? What does ethical practice look like for you specifically? What are your non-negotiable boundaries? What are you still exploring or uncertain about? A relationship philosophy is not fixed — it evolves as you grow, learn, and gain experience. Normalize uncertainty — not having everything figured out is not failure, it's honesty. Trauma-informed: many people's relationship philosophies are shaped by early experiences that may need examination and intentional revision.
- Reflection: "Write a brief statement of your relationship philosophy as it stands right now. What values, needs, and aspirations does it include?"

**Section 2 — "Continuing Education & SHA Resources"**
- Content: Learning doesn't end with this curriculum — it's a foundation for ongoing growth. SHA ongoing learning resources: recommended books (Polysecure, The Ethical Slut, Mating in Captivity, Come As You Are, Opening Up). Podcasts and online communities for continued learning. The importance of diverse perspectives — seeking out voices from marginalized communities, disabled creators, BIPOC educators, trans educators. Workshops and conferences: sex-positive events, kink education, relationship skills intensives. Online courses and webinars. How to evaluate the quality of sexuality education — look for credentials, evidence-based approaches, inclusive language, and trauma-informed framing. The difference between education and therapy — education provides knowledge and skills, therapy provides personalized healing and growth.
- Reflection: "What topics from this curriculum do you want to explore more deeply? What resources or learning opportunities will you pursue next?"

**Section 3 — "Finding Professional Support"**
- Content: When and how to seek professional support for relationship and sexual wellbeing. Types of providers: AASECT-certified sex therapists, couples therapists (Gottman-trained, EFT), individual therapists specializing in sexuality, pelvic floor therapists, sex educators and coaches. How to find providers: AASECT provider directory, Psychology Today filters, community referrals, SHA referral language. What to look for: kink-aware, ENM-affirming, LGBTQ+ competent, culturally responsive, trauma-informed. What to expect in sex therapy — it's talk therapy, not physical. How to advocate for yourself: asking about a provider's approach, requesting specific competencies, trusting your instincts. Cost and access: sliding scale options, community mental health, support groups. Normalizing help-seeking: therapy is an act of self-care and relationship investment, not a sign of failure.
- Reflection: "What would make it easier for you to seek professional support? What qualities are most important to you in a provider?"

**Section 4 — "Your Growth Edge"**
- Content: Identify your personal growth edge — the area where your current skills meet the challenges you most want to address. Growth edges might include: deepening communication skills, processing jealousy more effectively, exploring new aspects of your sexuality, building more secure attachment, creating a more intentional relationship structure, healing from past harm, developing greater self-compassion. Setting intentions (not resolutions) for continuing growth. Building a support network: partners, friends, community, professionals. The practice of self-compassion throughout growth — progress is not linear, setbacks are normal, and being kind to yourself accelerates learning. A closing affirmation: you've invested significant time and energy in understanding yourself and your relationships. That investment reflects your values and your commitment to building connections rooted in care, consent, and authenticity.
- Reflection: "What is your personal growth edge right now? What is one specific intention you want to set for your continuing journey?"

**Quiz Questions (7 total):**

Q1 (badge, order_index=0): "A personal relationship philosophy is best described as..."
- Options: [A] A fixed set of rules that never changes [B] A living document that articulates your values, needs, and aspirations and evolves over time ✓ [C] Something only therapists can help you create [D] A list of dealbreakers for potential partners
- Correct: 1
- explanation_correct: "Exactly — a relationship philosophy is living and evolving. It reflects your current values, needs, and aspirations while remaining open to growth and change."
- explanation_wrong: "A relationship philosophy is a living document — not fixed rules or a simple dealbreaker list. It evolves as you grow, gain experience, and deepen your self-understanding."

Q2 (badge, order_index=1): "When evaluating sexuality education resources, the most important qualities to look for are..."
- Options: [A] Popularity and entertainment value [B] Credentials, evidence-based approaches, inclusive language, and trauma-informed framing ✓ [C] Agreement with your existing beliefs [D] Recommendations from social media influencers
- Correct: 1
- explanation_correct: "Yes — quality sexuality education is credentialed, evidence-based, inclusive, and trauma-informed. These qualities ensure the information is reliable, respectful, and genuinely helpful."
- explanation_wrong: "Quality sexuality education should be evaluated based on credentials, evidence-based approaches, inclusive language, and trauma-informed framing — not popularity or confirmation of existing beliefs."

Q3 (checkpoint, is_checkpoint=true, position_in_section=1, linked to section 2): "Morgan wants to continue learning after completing this curriculum. The most effective approach would be..."
- Options: [A] Consider their learning complete [B] Seek diverse resources including books, workshops, and voices from marginalized communities ✓ [C] Only read materials that confirm what they already believe [D] Rely exclusively on social media for education
- Correct: 1
- explanation_correct: "Continuing education is most effective when it includes diverse perspectives, especially from marginalized voices. Books, workshops, and community resources provide depth that social media alone cannot."
- explanation_wrong: "Effective continuing education involves diverse resources and perspectives — especially voices from marginalized communities — rather than echo chambers or surface-level social media content."

Q4 (badge, order_index=2): Scenario about distinguishing when education is sufficient vs when therapy is needed — understanding the difference. SHA-aligned.

Q5 (badge, order_index=3): Scenario about advocating for yourself with a provider — asking about their kink/ENM competency. SHA-aligned.

Q6 (checkpoint, is_checkpoint=true, position_in_section=2, linked to section 3): Scenario about finding a provider who is both LGBTQ+ competent and ENM-affirming — using AASECT directory and community referrals. SHA-aligned.

Q7 (badge, order_index=4): Scenario about identifying a personal growth edge and setting a compassionate intention rather than a rigid goal. SHA-aligned.

---

### Execution Order

1. Badge 18 data operations
2. Badge 19 data operations
3. Badge 20 data operations

### Technical Details

- Each module: UPDATE description → DELETE quiz_questions → DELETE module_sections → INSERT 4 sections → query section IDs → INSERT 7 questions with checkpoint links
- Badge 19 (kink) includes explicit SHA KIC disclaimer in module description
- No schema migration needed
- No frontend changes
- No changes to tier, badge_number, order_index, prerequisite_badges

### Files Changed

| # | Type | Description |
|---|------|-------------|
| 1–3 | Data operations (x3) | Data operations for each Advanced Topics module |

