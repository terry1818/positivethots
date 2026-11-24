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
  // Words a member reads. "Likes" stays as the name of the tab; the action is always Connect.
  expect(likes.match(/liked you|\bUnlike\b|Your Likes|Likes You|likes sent/g) ?? []).toEqual([]);
  expect(likes).toContain(">Wants to connect<");
  expect(likes).toContain(">Your Connects<");
  expect(likes).toContain("<MatchModal");
  expect(likes).toContain("We couldn't load your Likes.");
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
