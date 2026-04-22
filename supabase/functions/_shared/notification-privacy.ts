// Shared helpers for privacy-safe push notification delivery.
//
// Lock-screen content must be GENERIC by default so a notification preview
// can't out a user as someone using a relationship/dating platform.
// Full content is delivered as the "expanded"/private body and only shown
// after the device is unlocked.
//
// We also enforce per-user daily frequency limits to avoid notification
// fatigue (and inadvertently signaling app usage through repeat buzzes).

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export type NotificationKind =
  | "new_match"
  | "new_message"
  | "super_like"
  | "badge_earned"
  | "boost_expired"
  | "streak_risk"
  | "streak_critical"
  | "winback"
  | "onboarding_nudge"
  | "weekly_summary"
  | "generic";

const PREVIEW_PREF_KEY = "pt_notify_show_previews";

const GENERIC_TITLE = "Positive Thots";
const GENERIC_BODY = "You have a new notification";
const GENERIC_REMINDER_BODY = "Reminder";

/**
 * Returns true if the user has explicitly enabled lock-screen previews.
 * Defaults to FALSE (privacy-safe) when unset.
 */
export async function getShowPreviewsPref(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_preferences")
      .select("value")
      .eq("user_id", userId)
      .eq("key", PREVIEW_PREF_KEY)
      .maybeSingle();
    if (!data) return false;
    // value is stored as JSON; accept boolean or "true"/"false" strings
    const v = (data as { value: unknown }).value;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "true";
    return false;
  } catch {
    return false;
  }
}

/**
 * Build a privacy-safe notification payload.
 *
 * Returns BOTH the lock-screen-visible (generic when previews off) text and
 * the full content for after-unlock display. Edge Function callers should
 * pass both to APNs/FCM so the OS can pick the right one based on lock state.
 */
export function buildSafePayload(
  kind: NotificationKind,
  fullBody: string,
  showPreviews: boolean,
  options?: { fullTitle?: string }
): {
  lockScreenTitle: string;
  lockScreenBody: string;
  fullTitle: string;
  fullBody: string;
} {
  const fullTitle = options?.fullTitle ?? GENERIC_TITLE;

  if (showPreviews) {
    return {
      lockScreenTitle: fullTitle,
      lockScreenBody: fullBody,
      fullTitle,
      fullBody,
    };
  }

  // Reminder-style alerts read better as "Reminder" than "new notification".
  const isReminder =
    kind === "streak_risk" ||
    kind === "streak_critical" ||
    kind === "onboarding_nudge" ||
    kind === "winback";

  return {
    lockScreenTitle: GENERIC_TITLE,
    lockScreenBody: isReminder ? GENERIC_REMINDER_BODY : GENERIC_BODY,
    fullTitle,
    fullBody,
  };
}

/**
 * Per-user daily frequency limit.
 *
 * Defaults: max 2 push notifications per user per UTC day. Direct messages
 * are exempt and capped separately at 5/day. Returns true if the send is
 * allowed under the limit.
 */
export async function withinDailyLimit(
  supabase: SupabaseClient,
  userId: string,
  kind: NotificationKind
): Promise<boolean> {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  try {
    const { data } = await supabase
      .from("analytics_events")
      .select("event_data")
      .eq("user_id", userId)
      .eq("event_name", "push_notification_sent")
      .gte("created_at", dayStart.toISOString());

    if (!data) return true;

    if (kind === "new_message") {
      const msgCount = data.filter(
        (r: { event_data: Record<string, unknown> | null }) =>
          (r.event_data?.type as string) === "new_message"
      ).length;
      return msgCount < 5;
    }

    const nonMessageCount = data.filter(
      (r: { event_data: Record<string, unknown> | null }) =>
        (r.event_data?.type as string) !== "new_message"
    ).length;
    return nonMessageCount < 2;
  } catch {
    // Fail-open: don't block notifications if the check itself errors.
    return true;
  }
}

/**
 * Convenience helper used by Lovable Cloud project where we only have a
 * service-role key in the function environment.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}
