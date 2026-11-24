# App kit: the Learn look for every screen

Learn has five things the rest of the app did not: a colour for each area, character art tied to
content, motion that shows progress, sound at key moments, and a celebration at the finish. The app
kit is the set of shared pieces that carry those to other screens. It lives at the end of
`src/index.css` (search for "App kit") and has no JavaScript of its own.

## Areas

Put one area class on a page's root. It sets the same `--path-top`, `--path-bottom` and `--path-lip`
colours Learn uses, plus `--kit-text` (a tint that is safe for text), so every kit piece inside picks
up the area colour.

| Class | Used for | Colour |
|-------|----------|--------|
| `kit-area-discover` | Discover | magenta |
| `kit-area-likes` | Likes | burnt orange |
| `kit-area-learn` | Learn-related cards outside Learn | brand purple |
| `kit-area-chat` | Chat | blue |
| `kit-area-profile` | Profile | teal |

Learn's own tier classes (`learn-tier-foundation` and the rest) work as area classes too. With no
area class, every kit piece falls back to brand purple.

`tests/app_kit.test.ts` checks that white text reaches 4.5:1 on each area colour and that each text
tint reaches 4.5:1 on cards in light and dark. Change a colour and that test tells you if it broke.

## Pieces

| Class | What it is |
|-------|------------|
| `kit-cta` (`kit-cta-sm`) | The chunky main button from lessons. One per screen. |
| `kit-panel` | Picture panel a character stands on. Give it a height. |
| `kit-card` | Card with a coloured edge and a lip. |
| `kit-row` (`kit-row-next`) | Tappable row. `kit-row-next` marks the one to do next. |
| `kit-coin` (`kit-coin-lg`, `kit-coin-round`) | Icon holder. `data-tone`: `area`, `reward`, `info`, `correct`, `urgent`, `highlight`, `pink`, `quiet`. |
| `kit-stat` + `kit-stat-value` + `kit-stat-label` | One number with one label. |
| `kit-progress` | Filled track: `<span class="kit-progress"><span style="width: 40%"/></span>`. |
| `kit-pips` | One pip per step: `<i data-done>` and `<i data-next>`. |
| `kit-chip` | Small pill. `data-tone`: default gold, `area`, `quiet`. |
| `kit-eyebrow`, `kit-text` | Small caps label, and text in the area tint. |
| `kit-header` | Page header strip in the area colour. |
| `kit-nav-item` + `kit-nav-pill` | Bottom navigation. Each tab carries its own area class. |
| `kit-rise`, `kit-pop` | Arrive once. Stagger with `style={{ "--i": n }}`. |

## Rules

- Characters go on empty, loading, error, celebration and "your own" screens. Never on another
  member's card and never inside a message thread.
- Motion only where it shows that something happened or what is next. Nothing loops except the
  "this is next" pip. Everything in the kit switches off under `prefers-reduced-motion`.
- Sound only at peak moments, always through `useSoundEffects` so the member's sound and haptic
  settings apply.
- 375px first, 44px tap targets, 4.5:1 text contrast in both themes.
- Do not show a reward the app does not actually grant.
- Screens outside Learn animate with CSS. `motion/react` components only animate inside the Learn
  layout, where `MotionProvider` is mounted.

## Daily spin wheel

`src/components/education/DailySpinWheel.tsx`. The disc is turned from script (not a CSS
transition) so each wedge can click past the pointer, and it brakes steadily like a real wheel.
`src/lib/spinWheel.ts` holds the prize list and the geometry; the tests prove the wheel stops on the
prize it awards and that every prize is one the server grants.

**Prizes.** The server runs the spin. `claim_daily_spin_v2()` (newest definition:
`supabase/migrations/20261124100000_*.sql`) picks the prize, grants it and answers with the wedge to
stop on; the app only animates to it (`src/lib/dailySpin.ts`, `runDailySpin` in `src/pages/Learn.tsx`).
The wheel spins freely until the answer arrives, then brakes onto that wedge.
The older `claim_daily_spin()` (8 wedges) is kept for copies of the app published before the
12-wedge wheel; both write `daily_spins`, so it is still one spin a day. A change to the wedge list
needs a new function name for the same reason: the published app and the database change at
different moments, and the wheel must never show a prize other than the one granted.

Twelve wedges, XP alternating with the other prizes:

| Tier | Chance | Wedges | Prizes |
|------|--------|--------|--------|
| Common | 54% | 0, 2, 6, 8 | +5, +10, +5, +15 XP |
| Uncommon | 28% | 1, 4, 7 | Double XP, +25 XP, Mystery Match Reveal |
| Rare | 13% | 3, 9, 10 | +1 Thot, Streak Freeze, +50 XP |
| Very rare | 5% | 5, 11 | Lucky Spin Frame, Profile Boost |

What each one really gives:

- **XP**: the wedge's amount, times a streak bonus (3 days 1.5×, 7 days 2×, 14 days 2.5×, 30 days 3×).
  The bonus is written as its own `xp_transactions` row (`daily_spin_bonus`) and stays inside the
  400 XP daily limit. The win card shows the sum and what the next level unlocks.
- **Double XP**: one token (`user_learning_stats.xp_doublers`, at most 3). The next finished lesson
  section pays double through `use_xp_doubler(section_id)`; the Learn header shows "2× XP ready".
- **+1 Thot**: added to the bank (`super_like_balance.balance`), which nothing resets.
- **Streak Freeze**: `streak_freezes` +1 (at most 3).
- **Mystery Match Reveal**: `profiles.bonus_mystery_reveals` +1 (at most 5), spent in Discover after
  the day's own reveals run out.
- **Lucky Spin Frame**: adds `lucky_spin` to `profiles.earned_frames`. The wheel is the only way to
  get it; it is chosen in Edit Profile like any other frame.
- **Profile Boost**: `boost_credits` +1 (at most 3), started from Profile ("Use Free Boost"). 24 hours.

`SPIN_REWARDS` and `SPIN_WEIGHTS` in `src/lib/spinWheel.ts` must match the SQL (order, values, tiers,
chances, streak bonus); `tests/app_kit.test.ts` reads the migration and fails if they drift. One spin
per UTC day. A prize that would be worth nothing to the member is swapped on the server: a VIP's
Thot, a fourth freeze or boost credit, a frame already owned become +50 XP; a fourth doubler or sixth
bonus reveal becomes +25 XP. If today's XP limit is already reached the spin still counts and the
wheel says so. If the call fails the spin is handed back. An app newer than its database falls back
to an XP-only spin. "What can I win?" under the wheel lists every prize with its tier's chance.

To add a prize: add the wedge to the SQL function and to `SPIN_REWARDS`, give it a look in `WEDGES`
and a line in `PRIZE_NOTE` and `PRIZE_LINE` (`DailySpinWheel.tsx`), and make sure the SQL really
grants it.

**Sounds.** Recorded files in `src/assets/sounds/spin/`, played by `src/lib/spinSounds.ts`: three
wooden clicks for the pointer (never the same one twice in a row; lower and fuller as the wheel
slows), a soft push of air at the start, and a bell phrase for each prize tier that grows with the
tier. They are rendered by `scripts/make_spin_sounds.py` (synthesised from scratch, so nothing is
licensed from anyone). To change a sound, edit that script and run it; do not hand-edit the files.
Until the files have loaded, each sound falls back to the simple version in `soundGenerator.ts`.

## Where it is applied

| Step | Screens | State |
|------|---------|-------|
| 0 | Kit | Done |
| 1 | Bottom nav, empty states, loading tint, welcome-back pop-up, daily spin, Likes and Chat headers | Done |
| 3 | Profile | Done |
| 2 | Discover | Not started |
| 4 | Likes and Chat content | Not started |
| 5 | Onboarding and sign-in | Not started |
| 6 | Premium, Wallet, Events | Not started |
| 7 | Settings, Resources, health pages (colour and spacing only) | Not started |

## Thots

`super_like_balance.daily_remaining` is today's free Thots (reset each day); `balance` is the bank of
earned or bought Thots, which nothing resets. The daily allowance is decided on the server from the
member's plan: free 1, Plus and Premium 5, VIP unlimited (`thot_daily_limit`). Sending a Thot is one
call, `send_thot`, which spends one (daily first, then the bank) and records it together. Members
cannot insert a balance or a Thot directly.

## Rewards that are real

Streaks: day 7 gives +1 Thot, day 30 a Profile Boost, day 100 +3 Thots (`grant-streak-reward`). The
Learn header shows the next one ("4d to +1 Thot").
Levels: 3 gives +1 Thot, 5 a streak freeze, 7 +2 Thots, 10 a Profile Boost credit
(`grant-level-reward`, which checks the member's real level). A boost credit is spent from Profile
("Use Free Boost", `use_boost_credit`). A Profile Boost lasts 24 hours
(`profile_boosts.expires_at`), and every screen says so.

## Things a member sees once

- **Page tours.** `useTutorialState(key)` answers from `profiles.tutorials_completed`, mirrored on the
  device (`pt_tutorials_seen`, per member). `seen` is true until the answer is known, so a tour opens
  only when we are sure it has not been finished; `ready` says the answer is in. Finish or skip calls
  `markSeen()`. Discover's walkthrough and swipe tutorial use the same hook
  (`discovery_walkthrough`, `swipe_tutorial`).
- **Cookie notice.** `CookieConsent` waits for sign-in to settle, then shows only when neither the
  device (`pt_cookie_consent`) nor the account (`user_preferences`, key `cookie_consent`) holds an
  answer.

## Fitting a phone

- A page laid out as a flex column (`h-screen flex flex-col`, as Discover is) must give each centred
  section `w-full`. `max-w-md mx-auto` alone lets the section grow as wide as its content, and the
  page clips it.
- The app's base text is 18.9px, not 16px, so `rem` sizes are about a fifth larger than Tailwind's
  usual pixel values. Check rows of several items at 320, 360, 375 and 393 pixels wide.
- Give the text side of a row `min-w-0` so a button on the other side is never pushed off the edge.

## Open items

- Subscription plans are read from Stripe by `check-subscription`, and Stripe is closed, so the app
  treats everyone as free. The server reads the `subscriptions` table instead. These need to become
  one source when the new payment processor is wired in.
