import { create } from "zustand";

interface SessionState {
  dismissedBanners: Set<string>;
  dismissBanner: (key: string) => void;
  isBannerDismissed: (key: string) => boolean;

  completedTutorials: Set<string>;
  completeTutorial: (key: string) => void;
  isTutorialComplete: (key: string) => boolean;

  referralCode: string | null;
  setReferralCode: (code: string | null) => void;

  sessionData: Map<string, any>;
  setSessionData: (key: string, value: any) => void;
  getSessionData: <T = any>(key: string, defaultValue: T) => T;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  dismissedBanners: new Set(),
  dismissBanner: (key) =>
    set((s) => {
      const next = new Set(s.dismissedBanners);
      next.add(key);
      return { dismissedBanners: next };
    }),
  isBannerDismissed: (key) => get().dismissedBanners.has(key),

  completedTutorials: new Set(),
  completeTutorial: (key) =>
    set((s) => {
      const next = new Set(s.completedTutorials);
      next.add(key);
      return { completedTutorials: next };
    }),
  isTutorialComplete: (key) => get().completedTutorials.has(key),

  referralCode: null,
  setReferralCode: (code) => set({ referralCode: code }),

  sessionData: new Map(),
  setSessionData: (key, value) =>
    set((s) => {
      const next = new Map(s.sessionData);
      next.set(key, value);
      return { sessionData: next };
    }),
  getSessionData: (key, defaultValue) => {
    const val = get().sessionData.get(key);
    return val !== undefined ? val : defaultValue;
  },
}));
