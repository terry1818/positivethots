

# Phase 6: Operational Readiness

Phase 6 covers the four remaining items before launch: error monitoring, analytics, custom email templates, and chat content moderation.

---

## 1. Error Monitoring Integration

**What**: A lightweight error logging system that captures client-side errors to a database table for admin review.

- Create an `error_logs` table (columns: `id`, `user_id`, `error_message`, `error_stack`, `page_url`, `created_at`) with RLS allowing authenticated users to insert their own errors and admins to read all.
- Create a global `reportError()` utility that inserts errors into the table.
- Enhance `ErrorBoundary.componentDidCatch` to call `reportError()`.
- Add a `window.onerror` / `window.onunhandledrejection` listener in `main.tsx` for uncaught errors.
- Add an **Error Logs** tab to the existing AdminPanel so admins can browse recent errors.

## 2. Analytics Integration

**What**: Track key user events (signups, swipes, matches, messages sent, module completions) to an `analytics_events` table for admin dashboards.

- Create an `analytics_events` table (columns: `id`, `user_id`, `event_name`, `event_data` jsonb, `created_at`) with RLS for insert-own and admin-read.
- Create a `trackEvent(eventName, data)` utility function.
- Instrument key actions: swipe, match, message sent, module completed, subscription started.
- Add an **Analytics** tab to AdminPanel with summary stats (daily active events, top events, user counts).

## 3. Custom Email Templates

**What**: Set up branded email templates for authentication emails (signup confirmation, password reset) using the email infrastructure tools.

- Use the `email_domain` tool group to scaffold auth email templates with app branding (logo, colors, footer links to Privacy/Terms).
- Templates for: email confirmation, password reset, magic link (if applicable).

## 4. Chat Content Moderation

**What**: Automated screening of chat messages for harmful content before delivery.

- Create a `moderate-message` edge function that uses Lovable AI (gemini-2.5-flash-lite) to classify messages as safe/flagged.
- On message send in `Chat.tsx`, call the moderation function. If flagged, block the message and warn the sender.
- Store flagged messages in a `flagged_messages` table for admin review.
- Add a **Moderation Queue** tab to AdminPanel showing flagged messages with approve/dismiss actions.

---

## Technical Details

**Database migrations** (single migration):
- `error_logs` table with RLS (insert own, admin select)
- `analytics_events` table with RLS (insert own, admin select)
- `flagged_messages` table with RLS (admin only)

**Edge functions**:
- `moderate-message` — accepts message text, calls Lovable AI for classification, returns safe/flagged verdict

**Files modified**:
- `src/components/ErrorBoundary.tsx` — add error reporting
- `src/main.tsx` — add global error handlers
- `src/pages/Chat.tsx` — add moderation check before sending
- `src/components/admin/AdminPanel.tsx` — add Error Logs, Analytics, Moderation tabs
- New: `src/lib/errorReporting.ts`, `src/lib/analytics.ts`
- New: `supabase/functions/moderate-message/index.ts`

**Email templates**: Scaffolded via email infrastructure tooling with project branding.

