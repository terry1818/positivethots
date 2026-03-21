

# Add 9 New Education Modules — Full Build-Out

## What's Being Built

9 new courses (excluding parenthood as requested), each with 5 rich content sections following the existing format: markdown articles with stats, research citations, practical exercises, and 2 YouTube video embeds per section. Then AI-generated quizzes for each section.

## The 9 Modules (already in DB)

| # | Module | Tier |
|---|--------|------|
| 1 | Trauma-Informed Relating | Relationships |
| 2 | Digital Consent & Boundaries | Sexual Health |
| 3 | Decolonizing Relationships | Identity |
| 4 | Mental Health First Aid for Partners | Relationships |
| 5 | Reproductive Autonomy & Justice | Sexual Health |
| 6 | Addiction & Compulsivity in Relationships | Advanced |
| 7 | Neurodivergence in Intimacy | Identity |
| 8 | Financial Intimacy | Advanced |
| 9 | Grief, Loss & Relationship Transitions | Relationships |

## Implementation Steps

### Step 1: Insert 45 Content Sections (5 per module)

Each module gets 5 sections following the established pattern of alternating articles and videos, with ~2000-2500 chars of markdown content per section including:
- Research citations and statistics
- Practical exercises and reflection questions
- 2 embedded YouTube videos per section via `[youtube:Title](url)` format
- ENM/relationship context where relevant

**Section structures per module:**

**Trauma-Informed Relating**: Understanding Trauma & Attachment → Recognizing Trauma Responses → Creating Safety in Intimate Spaces → Navigating Triggers Together → Healing Together: Resources & Practices

**Digital Consent & Boundaries**: Consent in the Digital Age → Sexting, Nudes & Photo Sharing → Online Harassment & Stalking → Digital Boundaries in Relationships → Building a Healthy Digital Life

**Decolonizing Relationships**: Relationship Norms Through History → Colonialism & Relationship Structures → Dismantling Heteronormativity & Amatonormativity → Cultural Diversity in Love & Family → Building Your Own Relationship Framework

**Mental Health First Aid for Partners**: Understanding Mental Health Basics → Recognizing Crisis Signs → How to Support Without Fixing → Setting Boundaries as a Supporter → Resources & Professional Help Navigation

**Reproductive Autonomy & Justice**: Bodily Autonomy as a Human Right → Contraception & Informed Choice → Reproductive Justice vs. Reproductive Rights → Access Equity & Systemic Barriers → Advocating for Reproductive Freedom

**Addiction & Compulsivity in Relationships**: Understanding Love Addiction & Codependency → Recognizing Compulsive Patterns → Love Bombing, Trauma Bonds & Toxic Cycles → Recovery & Breaking Patterns → Building Healthy Relationship Habits

**Neurodivergence in Intimacy**: Understanding Neurodivergence → Sensory Needs & Physical Intimacy → Communication Differences → Executive Function & Relationship Maintenance → Creating Neurodivergent-Affirming Relationships

**Financial Intimacy**: Why Money Kills Relationships → Financial Communication Skills → Shared Resource Models → Financial Boundaries & Autonomy → Building Financial Partnership

**Grief & Relationship Transitions**: Understanding Relationship Grief → The Art of Conscious Uncoupling → Grief in Non-Monogamous Structures → Staying Connected Through Change → Post-Relationship Growth

### Step 2: Generate Quiz Questions

Call the `generate-section-quizzes` edge function for each of the 9 new module slugs to auto-generate 4 quiz questions per section (20 per module, 180 total).

### Step 3: Update EducationBadge Component

Add 9 new entries to the `badgeIcons` map in `src/components/EducationBadge.tsx`:

| Slug | Icon |
|------|------|
| `trauma-informed-relating` | 🫂 |
| `digital-consent-boundaries` | 📱 |
| `decolonizing-relationships` | 🌍 |
| `mental-health-first-aid` | 🧠 |
| `reproductive-autonomy` | ⚕ |
| `addiction-compulsivity` | 🔄 |
| `neurodivergence-intimacy` | 🧩 |
| `financial-intimacy` | 💰 |
| `grief-relationship-transitions` | 🕊 |

## Files Changed

| File | Action |
|------|--------|
| Database: `module_sections` | Insert 45 rows (5 sections × 9 modules) |
| Database: `quiz_questions` | Auto-generated via edge function |
| `src/components/EducationBadge.tsx` | Add 9 new badge icons |

## Technical Notes
- Content inserted via psql `INSERT` statements (data operation, no migration needed)
- Each section has ~2000-2500 chars of rich markdown with YouTube embeds
- Quiz generation uses the existing `generate-section-quizzes` edge function with the Lovable AI gateway
- No schema changes needed — all tables already support this

