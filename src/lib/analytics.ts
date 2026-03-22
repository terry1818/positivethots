import { supabase } from "@/integrations/supabase/client";

export const trackEvent = async (
  eventName: string,
  eventData: Record<string, unknown> = {}
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("analytics_events").insert({
      user_id: session.user.id,
      event_name: eventName,
      event_data: eventData as any,
    });
  } catch (e) {
    console.error("Failed to track event:", e);
  }
};
