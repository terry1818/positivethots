

# Improve Next Unlock Context + Shareable Tier Completion Card

## 1. CompactProgressBar — Descriptive "Next Unlock"

**File: `src/components/discovery/CompactProgressBar.tsx`**

- Change the next unlock display to: `Complete [Tier Name] to unlock: [Feature Name]`
- Add a second line showing `nextFeature.description` in smaller muted text for full context

## 2. Shareable Tier Completion Card

**File: `src/components/education/CelebrationModal.tsx`**

When `type === "tier_complete"`:
- Add share buttons below "Continue": Twitter/X, Facebook, LinkedIn, Copy Link
- Share message includes what the user learned, e.g.:

> "I just completed the Sexual Health tier on Positive Thots! 🏆 I've passed courses covering STI prevention, safer sex practices, and sexual wellness. Join me in learning at positivethots.lovable.app"

- Map each tier to a summary of topics covered:
  - **Foundation**: consent, communication, boundaries, trust, and relationship basics
  - **Sexual Health**: STI prevention, safer sex practices, sexual wellness, and testing awareness
  - **Identity & Diversity**: gender identity, sexual orientation, pronouns, and inclusivity
  - **Healthy Relationships**: conflict resolution, attachment styles, emotional intelligence, and partner communication
  - **Advanced Topics**: ethical non-monogamy, kink education, community leadership, and mentorship

- "Share your achievement" label above share buttons
- Use `window.open` with standard share intents (no SDK)
- Copy Link button copies the text blurb to clipboard with a toast

## Files to modify
- `src/components/discovery/CompactProgressBar.tsx`
- `src/components/education/CelebrationModal.tsx`

