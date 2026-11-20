# Positive Thots — working in this repo

Positive Thots is an all-inclusive, education-gated relationship wellness and
education platform. Never call it a "dating app", and never position it as
built for one specific community. Tagline: "Learn first. Connect better."

## How code changes reach the app

This repo is two-way synced with the Lovable project `e9a42b4b`. Lovable only
syncs `main`.

- **Default path:** edit here, verify, push to `main`. Lovable pulls the commit
  in on its own. This uses no Lovable credits.
- **Lovable prompts are the fallback**, kept for what only Lovable can do.
- Never push while the Lovable agent is mid-edit or a publish is running. If
  both sides change before a sync, the GitHub version replaces Lovable's.

## Verify before every push

```bash
bun install --frozen-lockfile
npx tsc --noEmit -p tsconfig.app.json
npm run build
bun test
```

Use bun for installs; `npm ci` fails against this lockfile.

One known exception: `tests/video_event_access.test.ts` calls the `lovable` CLI
to query the live database, so it only passes inside Lovable's own sandbox.
Every other test must pass.

## What a push does NOT do

| Change | Syncs to Lovable | Goes live |
|--------|------------------|-----------|
| Frontend (`src/`, `public/`, config, `package.json`) | Yes | Only after Publish > Update in Lovable |
| Edge functions (`supabase/functions/`) | File only | Needs a Lovable prompt to deploy |
| Migrations (`supabase/migrations/`) | File only | Needs a Lovable prompt (or the SQL editor) to run |

Write and commit backend changes here, then batch them into ONE Lovable prompt:
"Deploy all changed edge functions and apply pending migrations."

The backend is Lovable's built-in Supabase. Do not point anything at a
personal Supabase project.

## Rules to read first

- `AGENTS.md` — access-control, XP, quiz, and Learn rules the Lovable agent
  follows. Keep changes consistent with it and add a line when a new rule is set.
- `docs/*-acceptance.md` — acceptance notes for recent Learn and character-art work.

## Non-negotiables

- Branded language: "Send a Thot" (never Super Like), "You Both Said Yes"
  (never It's a Match), "Connect" / "Pass" (never swipe right/left, like,
  reject), "Thot Pack".
- No Stripe. The Stripe account is closed.
- Mobile-first at 375px, 44x44px touch targets, WCAG 2.1 AA contrast, respect
  `prefers-reduced-motion`.
- Every screen needs loading, error, and empty states with the branded mascot.
- RLS on every new table.
- Never commit secrets. `.env` here holds only the publishable Supabase keys.
