

## Plan: Update External Website HTML

Since this is an external HTML file hosted on Namecheap, I'll generate an updated version of `index_1.html` as a downloadable file in `/mnt/documents/` that you can upload to replace your current site.

### Changes

**1. Fix Mobile Menu (Accessibility Bug)**
- The current mobile menu (`nav ul.open`) uses `position:fixed; inset:0` but inherits `background:var(--bg)` which is semi-transparent. The nav itself has `background:rgba(250,248,255,.92)` with backdrop-blur, but the menu overlay sits behind the nav bar (z-index:99 vs nav z-index:100).
- Fix: Give the mobile menu `background:var(--card)` (solid white), `z-index:101` (above nav), add a close button, and ensure text contrast.

**2. Update Pricing Section — Show All 3 Tiers**
- Currently only shows Premium ($9.99). Update to show Plus ($4.99), Premium ($9.99), and VIP ($19.99) side by side with their actual feature lists from `subscriptionTiers.ts`.
- Add one-time purchases mention (Profile Boost $2.99, Super Like Pack $1.99).

**3. Update Features Section — Reflect Actual App Features**
Current features listed are generic. Replace with actual implemented features:
- Education-First Discovery (complete 5 foundation badges to unlock swiping)
- Compatibility Scoring (algorithm based on badges, interests, relationship style)
- Real-Time Chat with unread badges and message moderation
- Curated Shop (Shopify-integrated merch/product store)
- Super Likes & Profile Boosts (one-time purchases)
- Incognito Mode (browse without being seen)
- Daily Challenges & Streaks (XP, combos, learning paths)
- Photo Moderation & Safety (AI-powered content moderation)

**4. Update "How It Works" Section**
Currently 4 steps. Update to reflect actual flow:
1. Sign Up & Verify Email
2. Complete Onboarding (preferences, photos, bio)
3. Earn 5 Foundation Badges (interactive courses + quizzes)
4. Discover & Connect (swipe, match, chat)

**5. Update Hero & CTA**
- Change "Join the Waitlist" → "Get Started Free" linking to `https://positivethots.lovable.app/auth`
- Update hero stats to reflect actual app capabilities
- Change "Coming Soon" language to launched/live language

**6. Update FAQ**
- Update Premium question to mention all 3 tiers (Plus/Premium/VIP)
- Update "When does the app launch?" to reflect current status
- Add FAQ about Super Likes and Profile Boosts

**7. Update Footer Links**
- Privacy and Terms links → point to `https://positivethots.lovable.app/privacy` and `/terms`
- Add link to the app itself

### Output
A single updated `index_1.html` file saved to `/mnt/documents/index.html` ready for upload to Namecheap.

### Files
| Action | File |
|--------|------|
| Generate | `/mnt/documents/index.html` — updated website |

