import { toast } from "sonner";

const APP_URL = "https://positivethots.app";

/** Invite someone to the app: the phone's share sheet where there is one, otherwise the link is copied.
 *  There is no public profile page, so this shares the app, not a member's profile. */
export async function shareApp(): Promise<void> {
  const data = {
    title: "Join Positive Thots",
    text: "Check out Positive Thots — the relationship wellness app where you learn first and connect better!",
    url: APP_URL,
  };
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      // Closing the share sheet is not an error; anything else falls through to copying the link.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(APP_URL);
    toast.success("Invite link copied!");
  } catch {
    toast.error(`Couldn't copy the link. It is ${APP_URL}`);
  }
}
