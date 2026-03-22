import { supabase } from "@/integrations/supabase/client";

export const reportError = async (error: Error, pageUrl?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("error_logs").insert({
      user_id: session.user.id,
      error_message: error.message?.slice(0, 2000) || "Unknown error",
      error_stack: error.stack?.slice(0, 5000) || null,
      page_url: pageUrl || window.location.href,
    });
  } catch (e) {
    console.error("Failed to report error:", e);
  }
};
