import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { landingRotation, pickLegacyXpReward, SPIN_REWARDS, SPIN_WEIGHTS, spinTravel, streakSpinMultiplier, wedgeUnderPointer } from "../src/lib/spinWheel";
import { getNextStreakReward } from "../src/hooks/useLearningStats";
import { tickShape } from "../src/lib/spinSounds";
import { computeProfileCompletion } from "../src/hooks/useProfileCompletion";
import { spinWinNotes } from "../src/lib/soundGenerator";

const css = readFileSync("src/index.css", "utf8");
const light = css.slice(css.indexOf("App kit"));
const value = (block: string, name: string) => {
  const m = block.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`));
  if (!m) throw new Error(`--${name} is not defined`);
  return [Number(m[1]), Number(m[2]), Number(m[3])] as const;
};
const rgb = ([h, s, l]: readonly [number, number, number]) => {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => { const k = (n + h / 30) % 12; return l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)] as const;
};
const luminance = (c: readonly number[]) => {
  const [r, g, b] = c.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: readonly number[], b: readonly number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const white = [1, 1, 1] as const;

test("white text is readable on every area colour", () => {
  for (const area of ["discover", "likes", "chat", "profile"]) {
    expect(contrast(white, rgb(value(light, `kit-${area}-top`)))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(white, rgb(value(light, `kit-${area}-bottom`)))).toBeGreaterThanOrEqual(4.5);
  }
});

test("each area's text tint is readable on cards in both themes", () => {
  const rootBlock = light.slice(light.indexOf(":root {"), light.indexOf(".dark {"));
  const darkBlock = light.slice(light.indexOf(".dark {"), light.indexOf(".kit-area-discover"));
  const lightCard = rgb([0, 0, 100]), darkCard = rgb([270, 20, 15]);
  for (const area of ["discover", "likes", "learn", "chat", "profile"]) {
    expect(contrast(rgb(value(rootBlock, `kit-${area}-text`)), lightCard)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rgb(value(darkBlock, `kit-${area}-text`)), darkCard)).toBeGreaterThanOrEqual(4.5);
  }
});

test("every kit colour has a fallback, so a kit piece works outside an area class", () => {
  const rules = light.split("\n").filter(line => /^\.kit-(?!area-)/.test(line));
  expect(rules.length).toBeGreaterThan(20);
  for (const rule of rules) expect(rule).not.toMatch(/var\(--path-(top|bottom|lip)\)/);
});

test("kit motion is switched off for people who ask for reduced motion", () => {
  const reduced = light.slice(light.lastIndexOf("@media (prefers-reduced-motion: reduce)", light.indexOf("Daily spin wheel")));
  for (const piece of [".kit-rise", ".kit-pop", ".kit-cta", ".kit-nav-pill"]) expect(reduced).toContain(piece);
  expect(css.slice(css.indexOf("Daily spin wheel"))).toContain("prefers-reduced-motion");
});

test("the wheel stops on the prize it awards", () => {
  const count = 8, seg = 360 / count;
  for (let index = 0; index < count; index++) {
    for (const within of [0, -(seg / 2 - 8), seg / 2 - 8]) {
      for (const from of [0, 337.5, 123.4]) {
        const landing = landingRotation(index, count, within);
        const end = from + spinTravel(from, landing);
        expect(wedgeUnderPointer(end, count)).toBe(index);
        expect(end - from).toBeGreaterThanOrEqual(360 * 6);
      }
    }
  }
});

test("rarer prizes get a longer win sound", () => {
  expect(spinWinNotes.common.length).toBeLessThan(spinWinNotes.uncommon.length);
  expect(spinWinNotes.uncommon.length).toBeLessThan(spinWinNotes.rare.length);
  expect(spinWinNotes.rare.length).toBeLessThan(spinWinNotes.very_rare.length);
});

test("profile steps match the checks behind the percentage", () => {
  const empty = computeProfileCompletion({ profile: { name: "A" }, userPhotos: [], badges: [], promptCount: 0 });
  expect(empty.percentage).toBe(10);
  expect(empty.steps.filter(s => s.done)).toHaveLength(0);
  expect(empty.steps).toHaveLength(9);

  const full = computeProfileCompletion({
    profile: { bio: "Hi", gender: "x", pronouns: "they", sexuality: "x", relationship_style: "x", relationship_status: "x", interests: ["a", "b", "c", "d", "e"], is_verified: true },
    userPhotos: [1, 2, 3], badges: [1], promptCount: 3,
  });
  expect(full.percentage).toBe(100);
  expect(full.steps.every(s => s.done)).toBe(true);
  expect(full.nudges).toHaveLength(0);

  const one = computeProfileCompletion({ profile: { name: "A" }, userPhotos: [1], badges: [], promptCount: 0 });
  expect(one.percentage).toBe(30);
  expect(one.steps.filter(s => s.done).map(s => s.key)).toEqual(["photo"]);
});

// The server picks and grants the prize, so the wheel's list must match the server's exactly.
const spinSql = (() => {
  const dir = "supabase/migrations";
  const file = readdirSync(dir).filter(f => readFileSync(`${dir}/${f}`, "utf8").includes("FUNCTION public.claim_daily_spin")).sort().pop();
  if (!file) throw new Error("no migration defines claim_daily_spin");
  return readFileSync(`${dir}/${file}`, "utf8");
})();

test("the wheel shows exactly the prizes the server grants, in the same order", () => {
  const values = spinSql.match(/_value := \(ARRAY\[([\d, ]+)\]\)/)![1].split(",").map(Number);
  const types = spinSql.match(/_type := \(ARRAY\[([a-z', ]+)\]\)/)![1].split(",").map(t => t.trim().replace(/'/g, ""));
  expect(values).toEqual(SPIN_REWARDS.map(r => r.value));
  expect(types).toEqual(SPIN_REWARDS.map(r => r.type));
  expect(SPIN_REWARDS).toHaveLength(12);
  for (const reward of SPIN_REWARDS.filter(r => r.type === "xp")) {
    expect(reward.label).toBe(`+${reward.value} XP`);
    expect(reward.value).toBeLessThanOrEqual(50); // award_xp grants at most 50 for a spin
  }
  // Every other kind of prize appears once, so a wedge never promises two of something.
  for (const type of ["thot", "freeze", "doubler", "reveal", "frame", "boost"]) {
    expect(SPIN_REWARDS.filter(r => r.type === type)).toHaveLength(1);
  }
  // No two neighbours are the same kind: XP alternates with the other prizes all the way round.
  SPIN_REWARDS.forEach((reward, i) => expect(reward.type === "xp").toBe(i % 2 === 0));
});

test("the app calls the spin function that matches its wheel", () => {
  // The 8-wedge claim_daily_spin stays for older published copies; this wheel needs the 12-wedge one.
  expect(spinSql).toContain("FUNCTION public.claim_daily_spin_v2()");
  expect(readFileSync("src/lib/dailySpin.ts", "utf8")).toContain('("claim_daily_spin_v2")');
});

test("the wheel's tiers and chances match the server's", () => {
  const tiers = [...spinSql.matchAll(/_roll < (\d+) THEN\s+_index := \(ARRAY\[([\d, ]+)\]\)/g)].map(m => ({ upTo: Number(m[1]), wedges: m[2].split(",").map(Number) }));
  const rest = spinSql.match(/ELSE\s+_index := \(ARRAY\[([\d, ]+)\]\)/)![1].split(",").map(Number);
  expect(tiers.map(t => t.upTo)).toEqual([54, 82, 95]);
  const byRarity = (rarity: string) => SPIN_REWARDS.map((r, i) => (r.rarity === rarity ? i : -1)).filter(i => i >= 0);
  expect(tiers[0].wedges).toEqual(byRarity("common"));
  expect(tiers[1].wedges).toEqual(byRarity("uncommon"));
  expect(tiers[2].wedges).toEqual(byRarity("rare"));
  expect(rest).toEqual(byRarity("very_rare"));
  expect(SPIN_WEIGHTS).toEqual({ common: 54, uncommon: 28, rare: 13, very_rare: 5 });
  expect(Object.values(SPIN_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
});

test("the streak bonus the wheel advertises is the one the server pays", () => {
  const rule = spinSql.match(/_mult := CASE (.+?) ELSE 1 END/)![1];
  const steps = [...rule.matchAll(/WHEN _streak >= (\d+) THEN ([\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
  expect(steps).toEqual([[30, 3], [14, 2.5], [7, 2], [3, 1.5]]);
  for (const [days, multiplier] of steps) {
    expect(streakSpinMultiplier(days)).toBe(multiplier);
    expect(streakSpinMultiplier(days - 1)).toBeLessThan(multiplier);
  }
  expect(streakSpinMultiplier(0)).toBe(1);
});

test("a profile boost is 24 hours everywhere it is described", () => {
  const profile = readFileSync("src/pages/Profile.tsx", "utf8");
  expect(profile).not.toMatch(/30[ -]minutes?/i);
  expect(profile).toMatch(/24 hours/);
  expect(readFileSync("src/components/education/DailySpinWheel.tsx", "utf8")).toMatch(/24 hours at the top of Discover/);
});

test("the fallback for an older database only ever picks XP", () => {
  for (let i = 0; i < 200; i++) {
    const picked = pickLegacyXpReward(() => i / 200);
    expect(picked.reward.type).toBe("xp");
    expect(SPIN_REWARDS[picked.index]).toBe(picked.reward);
  }
});

test("the streak label points at the next reward a streak really earns", () => {
  expect(getNextStreakReward(3)).toEqual({ day: 7, label: "+1 Thot", daysLeft: 4 });
  expect(getNextStreakReward(7)).toEqual({ day: 30, label: "Profile Boost", daysLeft: 23 });
  expect(getNextStreakReward(99)?.daysLeft).toBe(1);
  expect(getNextStreakReward(100)).toBeNull();
});

test("the wheel's recorded sounds exist and its clicks get lower and fuller as it slows", () => {
  for (const file of ["tick-1.wav", "tick-2.wav", "tick-3.wav", "start.mp3", "win-common.mp3", "win-uncommon.mp3", "win-rare.mp3", "win-very-rare.mp3"]) {
    expect(readFileSync(`src/assets/sounds/spin/${file}`).length).toBeGreaterThan(2000);
  }
  const fast = tickShape(0, 0.5), slow = tickShape(1, 0.5);
  expect(slow.gain).toBeGreaterThan(fast.gain);
  expect(slow.rate).toBeLessThan(fast.rate);
  expect(tickShape(5).gain).toBe(slow.gain);
});

// First-visit tours and the cookie notice must not come back for someone who has already dealt with them.
test("a tour opens only once we know the member has not finished it", () => {
  const hook = readFileSync("src/hooks/useTutorialState.ts", "utf8");
  expect(hook).toContain('useState<TutorialStatus>("unknown")');
  expect(hook).toContain('seen: status !== "unseen"');
  expect(hook).toContain("localStorage");
  const discover = readFileSync("src/pages/Index.tsx", "utf8");
  expect(discover).toContain('useTutorialState("discovery_walkthrough")');
  expect(discover).toContain('useTutorialState("swipe_tutorial")');
  expect(discover).toMatch(/!walkthroughReady \|\| !swipeTutorialReady\) return/);
});

test("the cookie notice waits for sign-in and remembers the answer on the device", () => {
  const notice = readFileSync("src/components/CookieConsent.tsx", "utf8");
  expect(notice).toMatch(/if \(authLoading\) return;/);
  expect(notice).toContain("writeLocalChoice(choice)");
  expect(notice).toMatch(/if \(data\) \{\s+writeLocalChoice/);
});

test("Discover's sections fill the phone's width instead of growing to fit their content", () => {
  const discover = readFileSync("src/pages/Index.tsx", "utf8");
  // In the page's flex column, mx-auto without w-full lets a section grow as wide as its content.
  const sections = (discover.match(/className="[^"]*"/g) ?? []).filter(c => /\bmx-auto\b/.test(c) && /\bmax-w-md\b/.test(c));
  expect(sections.length).toBeGreaterThanOrEqual(4);
  for (const section of sections) expect(section).toMatch(/\bw-full\b|\bcontainer\b/);
});

test("every policy link stays in the footer, and Discover carries the footer inside its own scroll area", () => {
  const footer = readFileSync("src/components/AppFooter.tsx", "utf8");
  for (const to of ["/complaints", "/appeals", "/cancellation", "/contact", "/privacy#do-not-sell", "/terms", "/privacy", "/community-guidelines"]) {
    expect(footer).toContain(`to: "${to}"`);
  }
  // Discover fills the screen and does not scroll, so the page-level footer is skipped there...
  expect(footer).toContain('const OWN_FOOTER = ["/"]');
  // ...and Discover shows the same footer at the end of its list.
  expect(readFileSync("src/pages/Index.tsx", "utf8")).toContain("<AppFooter inline />");
  // The footer clears the tab bar and Learn's continue bar.
  expect(light).toMatch(/body:has\(aside\[aria-label="Continue learning"\]\) \.app-footer/);
});

test("switches, checkboxes and radios answer a tap across 44px", () => {
  for (const file of ["switch", "checkbox", "radio-group"]) {
    const source = readFileSync(`src/components/ui/${file}.tsx`, "utf8");
    expect(source).toContain("after:h-[44px]");
    expect(source).toMatch(/after:w-\[44px\]|after:min-w-\[44px\]/);
  }
});

// Discover (step 2 of the rollout).
test("Discover fits the phone and keeps its three named actions under the card", () => {
  const page = readFileSync("src/pages/Index.tsx", "utf8");
  expect(page).toContain('className="kit-area-discover discover-screen"');
  expect(page).not.toMatch(/className="h-screen/);
  expect(light).toMatch(/\.discover-screen \{[^}]*height: 100dvh/);
  const card = readFileSync("src/components/discovery/SwipeDiscoveryCard.tsx", "utf8");
  for (const label of ['<span aria-hidden="true">Pass</span>', '"Send a Thot" : "Get Thots"', '<span aria-hidden="true">Connect</span>']) {
    expect(card).toContain(label);
  }
  expect(card).toContain('className="discover-dock"');
});

test("only a pressed pointer drags a card, and the arrival animation is not on the slot", () => {
  const card = readFileSync("src/components/discovery/SwipeDiscoveryCard.tsx", "utf8");
  expect(card).toMatch(/if \(!isTop \|\| !drag\.active\) return;/);
  expect(card).toContain('className="discover-card-slot"');
  expect(card).not.toMatch(/discover-card-slot[^\n]*animate-card-enter/);
  // An upward swipe sends a Thot only when there is one to send.
  expect(card).toMatch(/if \(hasThot && drag\.y < -THOT_PULL/);
});

test("Discover never uses another product's words, and describes the platform as for everyone", () => {
  const files = ["src/pages/Index.tsx", "src/components/MatchModal.tsx", ...readdirSync("src/components/discovery").map(f => `src/components/discovery/${f}`)];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    // Words a member would read (code names such as onSuperLike have no space and are not matched).
    expect(source.match(/Super Like|It's a Match|Swipe Right|Swipe Left/g) ?? []).toEqual([]);
  }
  const page = readFileSync("src/pages/Index.tsx", "utf8");
  // How the page describes the platform to search engines and link previews.
  const descriptions = page.match(/description[=:]\s*"[^"]+"/g) ?? [];
  expect(descriptions.length).toBeGreaterThanOrEqual(2);
  for (const description of descriptions) expect(description).not.toMatch(/polyamory|non-monogamy|LGBTQ|dating/i);
  expect(readFileSync("src/components/MatchModal.tsx", "utf8")).toContain('"You Both Said Yes"');
});

test("a failed load of Discover has its own state, and the celebration's safety link goes somewhere real", () => {
  const page = readFileSync("src/pages/Index.tsx", "utf8");
  expect(page).toContain("We couldn't load Discover.");
  expect(page).toMatch(/if \(profilesResult\.error \|\| !profilesResult\.data\) \{\s+setLoadError\(true\)/);
  const modal = readFileSync("src/components/MatchModal.tsx", "utf8");
  expect(modal).not.toContain("/privacy-policy");
  expect(readFileSync("src/App.tsx", "utf8")).toContain('path="/resources"');
});

// Likes and Chat (step 4 of the rollout).
test("Likes speaks in Connects, celebrates a mutual yes and has its own error states", () => {
  const likes = readFileSync("src/pages/LikesYou.tsx", "utf8");
  // Words a member reads. The tab is "Connects"; the word "like" is never shown.
  expect(likes.match(/liked you|\bUnlike\b|Your Likes|Likes You|likes sent|>Likes</g) ?? []).toEqual([]);
  expect(readFileSync("src/components/BottomNav.tsx", "utf8")).toContain('label: "Connects"');
  // The upsell names the plan the server actually asks for: any plan, so the cheapest one.
  expect(likes).toContain("Plus is $4.99 a month");
  expect(likes).not.toContain("9.99");
  expect(likes).toContain(">Wants to connect<");
  expect(likes).toContain(">Your Connects<");
  expect(likes).toContain("<MatchModal");
  expect(likes).toContain("We couldn't load your Connects.");
  // Pass and Connect are named, not bare icons.
  expect(likes).toMatch(/aria-label=\{`Pass on \$\{liker\.name\}`\}/);
  expect(likes).toMatch(/aria-label=\{`Connect with \$\{liker\.name\}`\}/);
});

test("the Chat list marks what is unread, never fetches a picture from another service, and can fail honestly", () => {
  const list = readFileSync("src/pages/Messages.tsx", "utf8");
  expect(list).not.toMatch(/dicebear|https?:\/\/api\./);
  expect(list).toContain("message_read_receipts");
  expect(list).toContain("We couldn't load your conversations.");
  expect(list).toContain("const isUnread");
});

test("a conversation fits the phone, has no controls that do nothing, and keeps report and block close", () => {
  const chat = readFileSync("src/pages/Chat.tsx", "utf8");
  expect(chat).toContain('className="kit-area-chat chat-screen"');
  expect(light).toMatch(/\.chat-screen \{[^}]*height: 100dvh/);
  for (const dead of ["Voice Call", "Video Call", "Attach image", "Send gift", "Emoji picker", "Voice message"]) {
    expect(chat).not.toContain(dead);
  }
  expect(chat).toMatch(/aria-label=\{`Report \$\{otherUser\.name\}`\}/);
  expect(chat).toMatch(/aria-label=\{`Block \$\{otherUser\.name\}`\}/);
  // The scroll stays inside the message list.
  expect(chat).toContain('block: "nearest"');
  // No footer under the composer; the menu links the policy that matters in a conversation.
  expect(readFileSync("src/components/AppFooter.tsx", "utf8")).toContain('const NO_FOOTER_PREFIX = ["/chat/"]');
  expect(chat).toContain('navigate("/complaints")');
});

// Sign-in and onboarding (step 5 of the rollout).
test("sign-in and onboarding are for everyone and make no unsourced claims", () => {
  const onboarding = readFileSync("src/pages/Onboarding.tsx", "utf8");
  // What a new member is asked: nothing that assumes one relationship style.
  const asked = [...onboarding.matchAll(/(?:title|subtitle|label|description)[=:]\s*"([^"]+)"/g)].map(m => m[1]);
  expect(asked.length).toBeGreaterThan(20);
  expect(asked.filter(text => /\bENM\b|ethical non-monogamy/.test(text) && !/^ENM$/.test(text))).toEqual([]);
  // No option is called "Popular" without data behind it.
  expect(onboarding).not.toMatch(/>Popular</);
  expect(readFileSync("src/components/onboarding/ChipSelector.tsx", "utf8")).not.toMatch(/>Popular</);
  const auth = readFileSync("src/pages/Auth.tsx", "utf8");
  expect(auth).toContain('className="kit-area-learn kit-entry"');
  for (const hint of ['autoComplete="email"', '"new-password" : "current-password"', 'autoComplete="bday"']) expect(auth).toContain(hint);
  expect(auth).not.toMatch(/animate-blob-float/);
  expect(onboarding).not.toMatch(/animate-blob-float/);
});

test("the kit's tabs and choices exist, and choices stand still under reduced motion", () => {
  expect(light).toMatch(/\.kit-tabs \.kit-tab\[data-state="active"\]/);
  expect(light).toMatch(/\.kit-option\[data-selected="true"\]/);
  expect(light).toMatch(/prefers-reduced-motion: reduce\) \{ \.kit-option \{ transition: none; \}/);
});

// Plans, Wallet and Events (step 6 of the rollout).
test("the app shows the plan the server grants", () => {
  const { pickActivePlan } = require("../src/hooks/useSubscription") as typeof import("../src/hooks/useSubscription");
  const now = Date.parse("2026-11-24T12:00:00Z");
  expect(pickActivePlan([], now)).toBeNull();
  expect(pickActivePlan([{ plan: "plus", status: "canceled", current_period_end: null }], now)).toBeNull();
  expect(pickActivePlan([{ plan: "plus", status: "active", current_period_end: "2026-11-01T00:00:00Z" }], now)).toBeNull();
  expect(pickActivePlan([{ plan: "plus", status: "active", current_period_end: null }, { plan: "vip", status: "active", current_period_end: "2026-12-24T00:00:00Z" }], now)?.plan).toBe("vip");
  expect(pickActivePlan([{ plan: "gold", status: "active", current_period_end: null }], now)).toBeNull();
});

test("each plan card lists only what that plan adds, and every feature appears once", () => {
  const { planAdds, ALL_FEATURES } = require("../src/lib/subscriptionTiers") as typeof import("../src/lib/subscriptionTiers");
  const plus = planAdds("plus"), premium = planAdds("premium"), vip = planAdds("vip");
  expect(plus.includes).toBeNull();
  expect(premium.includes).toBe("Plus");
  expect(vip.includes).toBe("Premium");
  expect([...plus.adds, ...premium.adds, ...vip.adds].sort()).toEqual([...ALL_FEATURES].sort());
});

test("no screen offers a checkout while payments are closed, and plans still show prices and the cancellation policy", () => {
  const pay = readFileSync("src/lib/payments.ts", "utf8");
  const plans = readFileSync("src/pages/Premium.tsx", "utf8");
  const card = readFileSync("src/components/events/EventCard.tsx", "utf8");
  expect(pay).toMatch(/export const PAYMENTS_OPEN = (true|false);/);
  expect(plans).toMatch(/if \(!PAYMENTS_OPEN( \|\| !renewalAgreed)?\) return;/);
  expect(plans).toContain("{PAYMENTS_OPEN && (\n          <>");
  expect(card).toContain("PAYMENTS_OPEN ? (");
  expect(plans).toContain('to="/cancellation"');
  expect(plans).toContain("${config.price}");
  // A checkout that fails says so instead of doing nothing.
  expect(plans).toContain("We couldn't open checkout");
  expect(plans.match(/Super Like|liked you|likes you|Stripe/gi) ?? []).toEqual([]);
});

test("the Wallet shows what a member holds and never offers coins that nothing grants", () => {
  const wallet = readFileSync("src/pages/Wallet.tsx", "utf8");
  for (const col of ["streak_freezes", "boost_credits", "xp_doublers", "bonus_mystery_reveals", "earned_frames"]) expect(wallet).toContain(col);
  expect(wallet).toContain("COINS_LIVE ? (");
  expect(wallet).not.toContain("How to Earn");
  expect(wallet).toContain("We couldn't load your Wallet.");
  expect(readFileSync("src/pages/Profile.tsx", "utf8")).toContain('navigate("/wallet")');
});

test("Events can fail honestly, says who each kind is for, and points its tour at things that exist", () => {
  const events = readFileSync("src/pages/Events.tsx", "utf8");
  expect(events).toContain("We couldn't load events.");
  expect(events).toContain("if (error) throw error;");
  expect(events).toContain('data-tour={i === 0 ? "events-card-first" : undefined}');
  expect(events).toContain("For VIP members who have finished the Advanced lessons.");
  expect(events).toContain("kit-area-discover");
});

// Perks, the Today checklist and the server-counted week.
test("perks can be earned by learning or by plan", () => {
  const { sectionsFinished, memberPerks, canUseAdvancedFilters } = require("../src/lib/perks") as typeof import("../src/lib/perks");
  const modules = [{ id: "a", tier: "relationships" }, { id: "b", tier: "relationships" }, { id: "c", tier: "advanced" }];
  expect([...sectionsFinished(modules, new Set(["a"]))]).toEqual([]);
  const done = sectionsFinished(modules, new Set(["a", "b"]));
  expect(memberPerks(undefined, done)).toEqual({ priority: true, mentor: false });
  expect(memberPerks({ priority: true, mentor: true }, new Set())).toEqual({ priority: true, mentor: true });
  expect(memberPerks(undefined, new Set())).toEqual({ priority: false, mentor: false });
  expect(canUseAdvancedFilters("plus", new Set())).toBe(false);
  expect(canUseAdvancedFilters("premium", new Set())).toBe(true);
  expect(canUseAdvancedFilters("free", new Set(["identity"]))).toBe(true);
});

test("the Today checklist words every challenge and never scrolls sideways", () => {
  const { challengeLabel, nextSprintMark, daysLeftLabel, SPRINT_MARKS } = require("../src/lib/learnWeek") as typeof import("../src/lib/learnWeek");
  for (const type of ["sections", "xp", "practice", "reflection", "perfect_quiz", "badge", "mix", "quiz_correct"] as const)
    expect(challengeLabel({ type, target: 2 }).length).toBeGreaterThan(8);
  expect(challengeLabel({ type: "sections", target: 1 })).toBe("Finish a lesson");
  expect(nextSprintMark(0)?.xp).toBe(100);
  expect(nextSprintMark(250)?.name).toBe("Gold");
  expect(nextSprintMark(500)).toBeNull();
  expect(SPRINT_MARKS.map(m => m.xp)).toEqual([100, 250, 500]);
  const now = Date.parse("2026-11-24T12:00:00Z");
  expect(daysLeftLabel("2026-11-30T00:00:00Z", now)).toBe("5 days left");
  expect(daysLeftLabel("2026-11-24T20:00:00Z", now)).toBe("Ends today");
  const today = readFileSync("src/components/education/LearnToday.tsx", "utf8");
  expect(today).not.toContain("overflow-x-auto");
  expect(today).toContain("of 3 done");
  // Progress is counted by the server, so the app never writes it.
  expect(readFileSync("src/hooks/useLearningStats.ts", "utf8")).not.toContain('from("daily_challenges")');
});

test("the server counts the week from the XP ledger and members cannot mint coins or codes", () => {
  const dir = "supabase/migrations";
  const sql = readFileSync(`${dir}/${readdirSync(dir).filter(f => f.startsWith("20261124160000")).pop()}`, "utf8");
  expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.credit_coins(uuid, integer, text, text, uuid) FROM PUBLIC, anon, authenticated;");
  expect(sql).toContain('DROP POLICY IF EXISTS "Users can insert own codes" ON public.promo_codes;');
  expect(sql).toContain('DROP POLICY IF EXISTS "Users can update own sprint data" ON public.sprint_participants;');
  expect(sql).toContain("AFTER INSERT ON public.xp_transactions");
  // The sprint marks the app shows are the marks the server pays at.
  for (const xp of [100, 250, 500]) expect(sql).toContain(`_xp >= ${xp}`);
  expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
});

test("the landing page uses the branded words and the real pack prices", () => {
  const html = readFileSync("public/landing.html", "utf8").split("\n").filter(l => l.length < 3000).join("\n");
  expect(html.match(/Super Like|swipe right|for the ENM, polyamory/gi) ?? []).toEqual([]);
  expect(html).toContain("$1.99 for 5, $3.99 for 10");
});

test("advanced filters: an empty group means anyone, and options are only values people have stated", () => {
  const { passesFilters, filterOptions, filtersActive, filterLabel, NO_FILTERS } = require("../src/lib/discoverFilters") as typeof import("../src/lib/discoverFilters");
  const people = [{ gender: "woman", relationship_style: "monogamous" }, { gender: "man", relationship_style: null }, { gender: "woman", relationship_style: "open" }, { gender: null, relationship_style: "open" }];
  expect(people.every(p => passesFilters(p, NO_FILTERS))).toBe(true);
  expect(people.filter(p => passesFilters(p, { genders: ["woman"], styles: [] })).length).toBe(2);
  expect(people.filter(p => passesFilters(p, { genders: ["woman"], styles: ["open"] })).length).toBe(1);
  expect(people.filter(p => passesFilters(p, { genders: [], styles: ["open"] })).length).toBe(2);
  expect(filterOptions(people)).toEqual({ genders: ["woman", "man"], styles: ["open", "monogamous"] });
  expect(filtersActive(NO_FILTERS)).toBe(false);
  expect(filterLabel("relationship-anarchy")).toBe("Relationship Anarchy");
  const page = readFileSync("src/pages/Index.tsx", "utf8");
  // Filters only apply for a member who has unlocked them.
  expect(page).toContain("if (canFilterRef.current && !passesFilters(p, filtersRef.current)) return false;");
});

test("the screens between onboarding sections wait for the member and name the real Foundation lessons", () => {
  const pause = readFileSync("src/components/onboarding/PhaseInterstitial.tsx", "utf8");
  expect(pause).not.toContain("setTimeout");
  expect(pause).toContain("kit-cta");
  const intro = readFileSync("src/components/onboarding/ValuePropositionScreen.tsx", "utf8");
  expect(intro).toContain("digital-consent-boundaries");
  expect(intro).not.toContain("understanding-desire");
  expect(intro.match(/gold standard|therapists use with their clients|peer-reviewed/g) ?? []).toEqual([]);
  expect(readFileSync("src/components/education/LearnToday.tsx", "utf8")).toContain("sprintMembers >= LEADERBOARD_MIN");
});

test("database functions are never called through a detached reference", () => {
  // supabase.rpc reads `this`. Casting it and calling the result directly throws in the real client,
  // which is what stopped Discover loading. Every cast must go through .bind(supabase).
  const files = new Bun.Glob("src/**/*.{ts,tsx}").scanSync(".");
  const bad: string[] = [];
  for (const f of files) if (/supabase\.rpc as unknown as/.test(readFileSync(f, "utf8"))) bad.push(f);
  expect(bad).toEqual([]);
});

test("a database call is never given .catch or .finally, which it does not have", () => {
  // supabase.from(...) and supabase.rpc(...) can be awaited but are not full Promises. Chaining .catch
  // onto one throws before the request is sent; this is what kept Discover from loading.
  const bad: string[] = [];
  for (const f of new Bun.Glob("src/**/*.{ts,tsx}").scanSync(".")) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/supabase\s*\.(?:rpc|from)\b[^;]{0,400}?\)\s*\.(?:catch|finally)\(/g)) {
      // functions.invoke and queryClient.fetchQuery return real Promises and may be chained.
      if (!m[0].includes("functions.invoke") && !m[0].includes("fetchQuery")) bad.push(f);
    }
  }
  expect(bad).toEqual([]);
  expect(readFileSync("src/pages/Index.tsx", "utf8")).toContain("const loadPlanPerks = async ()");
});
