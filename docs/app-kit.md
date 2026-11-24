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

**Prizes.** Every wedge is XP, between 5 and 50. The server (`award_xp`, source `daily_spin`) grants
at most 50 XP for a spin and only one spin per UTC day, so the wheel cannot promise more than that.
The win card shows the XP the server actually added. If the server says today's spin is already used,
the wheel says so and no prize is shown; if saving fails, the spin is handed back.

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

## Open items

- Other prize types on the wheel (a Thot, a streak freeze) need a server function that picks and
  grants the prize. Thots also need `refresh_daily_super_likes` changed first: on a new day it sets
  the balance to the daily limit, which wipes any bonus Thots, and free members never see a balance.
- The Learn header shows a streak multiplier ("1.5× XP") but XP is not multiplied anywhere.
