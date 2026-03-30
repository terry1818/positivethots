import { isNative } from "@/lib/capacitor";
import { trackEvent } from "@/lib/analytics";

export type AchievementType =
  | "badge_earned"
  | "streak_milestone"
  | "tier_complete"
  | "mentor_earned"
  | "compatibility_score";

export interface AchievementData {
  type: AchievementType;
  badgeName?: string;
  streakDays?: number;
  tierName?: string;
  compatibilityScore?: number;
  badgeCount?: number;
}

const APP_URL = "https://positivethots.com";
const SHARE_URL = `${APP_URL}?utm_source=achievement_share`;
const HANDLE = "@positivethots";
const HOOK_LINES: Record<AchievementType, string> = {
  badge_earned: "Think you know everything about intimacy? 🤔",
  streak_milestone: "Consistency is the real flex 💪",
  tier_complete: "Education unlocks deeper connections 🔓",
  mentor_earned: "Knowledge is the ultimate attraction ✨",
  compatibility_score: "Real connections start with understanding 💜",
};

const BADGE_ICONS: Record<AchievementType, string> = {
  badge_earned: "🎓",
  streak_milestone: "🔥",
  tier_complete: "🛡️",
  mentor_earned: "⭐",
  compatibility_score: "💜",
};

const PILL_LABELS: Record<AchievementType, string> = {
  badge_earned: "Badge Earned",
  streak_milestone: "Streak Milestone",
  tier_complete: "Tier Complete",
  mentor_earned: "Master Scholar",
  compatibility_score: "First Connection",
};

// Brand gradient stops
const GRADIENT_THEMES: Record<AchievementType, { from: string; via: string; to: string }> = {
  badge_earned:       { from: "#7C3AED", via: "#6D28D9", to: "#DB2777" },
  streak_milestone:   { from: "#D97706", via: "#B45309", to: "#7C3AED" },
  tier_complete:      { from: "#CA8A04", via: "#A16207", to: "#7C3AED" },
  mentor_earned:      { from: "#7C3AED", via: "#9333EA", to: "#EC4899" },
  compatibility_score:{ from: "#EC4899", via: "#BE185D", to: "#7C3AED" },
};

function getTitle(data: AchievementData): string {
  switch (data.type) {
    case "badge_earned": return data.badgeName || "Badge Earned";
    case "streak_milestone": return `${data.streakDays}-Day Streak!`;
    case "tier_complete": return `${data.tierName || "Tier"} Complete!`;
    case "mentor_earned": return "Master Scholar";
    case "compatibility_score": return "First Connection!";
  }
}

function getDescription(data: AchievementData): string {
  switch (data.type) {
    case "badge_earned": return `I completed my ${data.badgeName} badge on Positive Thots!`;
    case "streak_milestone": return `${data.streakDays} consecutive days of learning about healthy relationships!`;
    case "tier_complete": return `All ${data.tierName} badges complete on Positive Thots!`;
    case "mentor_earned": return "All 20 education badges complete — I'm officially a mentor!";
    case "compatibility_score": return "Found an incredible compatibility match on Positive Thots!";
  }
}

function getPillLabel(data: AchievementData): string {
  if (data.type === "streak_milestone") return `${data.streakDays}-Day Streak!`;
  if (data.type === "tier_complete" && data.tierName) return `${data.tierName} Complete`;
  return PILL_LABELS[data.type];
}

// ── Drawing helpers ──

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawBrandGradientBg(ctx: CanvasRenderingContext2D, w: number, h: number, theme: typeof GRADIENT_THEMES[AchievementType]) {
  // Main diagonal gradient
  const bg = ctx.createLinearGradient(0, 0, w * 0.3, h);
  bg.addColorStop(0, theme.from);
  bg.addColorStop(0.5, theme.via);
  bg.addColorStop(1, theme.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle darker overlay at edges for depth
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.9);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Large soft white glow behind center content
  const centerGlow = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, w * 0.5);
  centerGlow.addColorStop(0, "rgba(255,255,255,0.08)");
  centerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid texture
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  const gs = 50;
  for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.restore();
}

function drawDecoSparkles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Scattered white sparkle dots
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 1.5 + Math.random() * 2.5;
    ctx.save();
    ctx.fillStyle = "white";
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBadgeCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, emoji: string) {
  // Outer glow ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(255,255,255,0.4)";
  ctx.shadowBlur = 30;
  ctx.stroke();
  ctx.restore();

  // White circle fill
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Emoji
  ctx.save();
  ctx.font = `${Math.round(radius * 1.1)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + 4);
  ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string) {
  ctx.save();
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 56;
  const ph = 50;
  const px = cx - pw / 2;
  const py = cy - ph / 2;

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, ph / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

function drawGradientSeparator(ctx: CanvasRenderingContext2D, cx: number, y: number, lineWidth: number) {
  const grad = ctx.createLinearGradient(cx - lineWidth / 2, 0, cx + lineWidth / 2, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.3, "rgba(255,255,255,0.4)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - lineWidth / 2, y, lineWidth, 2);
}

// ── Main render ──

export function generateAchievementCard(
  data: AchievementData,
  format: "story" | "square" = "story",
  mascotImg?: HTMLImageElement | null,
  _logoImg?: HTMLImageElement | null,
): HTMLCanvasElement {
  const w = 1080;
  const h = format === "story" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const isStory = format === "story";
  const theme = GRADIENT_THEMES[data.type];
  const emoji = BADGE_ICONS[data.type];
  const safeX = 80; // horizontal padding
  const contentW = w - safeX * 2;

  // ── Background ──
  drawBrandGradientBg(ctx, w, h, theme);
  drawDecoSparkles(ctx, w, h);

  if (isStory) {
    // ════════════════════════════════════════════
    // STORY FORMAT (9:16 = 1080×1920)
    // Safe zone: 80px sides, 200px top/bottom
    // ════════════════════════════════════════════
    const safeTop = 200;
    const safeBot = 200;
    let y = safeTop;

    // ── WORDMARK ──
    ctx.save();
    ctx.font = "56px 'Pacifico', cursive";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    ctx.fillText("Positive Thots", w / 2, y);
    ctx.restore();
    y += 50;

    // Tagline
    ctx.save();
    ctx.font = "28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("Learn first. Connect better.", w / 2, y);
    ctx.restore();
    y += 30;

    // Separator
    drawGradientSeparator(ctx, w / 2, y, w * 0.5);
    y += 60;

    // ── HOOK LINE ──
    ctx.save();
    ctx.font = "italic 30px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(HOOK_LINES[data.type], w / 2, y);
    ctx.restore();
    y += 80;

    // ── BADGE ICON (large, centered) ──
    const badgeRadius = 110;
    const badgeCY = y + badgeRadius;
    drawBadgeCircle(ctx, w / 2, badgeCY, badgeRadius, emoji);
    y = badgeCY + badgeRadius + 50;

    // ── PILL ──
    const pillText = `${emoji}  ${getPillLabel(data)}`;
    drawPill(ctx, w / 2, y, pillText);
    y += 55;

    // ── BADGE NAME (large, bold) ──
    ctx.save();
    ctx.font = "bold 60px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 8;
    const title = getTitle(data);
    const titleLines = wrapText(ctx, title, contentW);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, y + i * 72);
    });
    ctx.restore();
    y += titleLines.length * 72 + 20;

    // ── DESCRIPTION ──
    ctx.save();
    ctx.font = "32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const descLines = wrapText(ctx, getDescription(data), contentW);
    descLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, y + i * 44);
    });
    ctx.restore();
    y += descLines.length * 44 + 20;

    // ── BADGE COUNT (social proof) ──
    if (data.badgeCount && data.badgeCount > 0) {
      ctx.save();
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(`${data.badgeCount} Badge${data.badgeCount > 1 ? "s" : ""} Earned`, w / 2, y);
      ctx.restore();
      y += 40;
    }

    // ── BOTTOM ZONE ──
    // Position from bottom up within safe area
    const botY = h - safeBot;

    // Handle
    ctx.save();
    ctx.font = "28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(HANDLE, w / 2, botY);
    ctx.restore();

    // URL
    ctx.save();
    ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText("positivethots.com", w / 2, botY - 50);
    ctx.restore();

    // CTA
    ctx.save();
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("Join the journey →", w / 2, botY - 100);
    ctx.restore();

    // Separator above CTA
    drawGradientSeparator(ctx, w / 2, botY - 140, w * 0.4);

    // Mascot (left of CTA area, if available)
    if (mascotImg && mascotImg.naturalWidth > 0) {
      const mH = 160;
      const mW = (mascotImg.width / mascotImg.height) * mH;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(mascotImg, 60, botY - 160, mW, mH);
      ctx.restore();
    }

  } else {
    // ════════════════════════════════════════════
    // SQUARE FORMAT (1:1 = 1080×1080)
    // Tight, centered layout
    // ════════════════════════════════════════════
    const padX = 80;
    const cW = w - padX * 2;
    let y = 80;

    // ── WORDMARK (top-left) ──
    ctx.save();
    ctx.font = "40px 'Pacifico', cursive";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 6;
    ctx.fillText("Positive Thots", padX, y);
    ctx.restore();
    y += 70;

    // ── HOOK LINE ──
    ctx.save();
    ctx.font = "italic 24px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(HOOK_LINES[data.type], w / 2, y);
    ctx.restore();
    y += 50;

    // ── BADGE ICON ──
    const badgeR = 85;
    const badgeCY = y + badgeR;
    drawBadgeCircle(ctx, w / 2, badgeCY, badgeR, emoji);
    y = badgeCY + badgeR + 35;

    // ── PILL ──
    const pillText = `${emoji}  ${getPillLabel(data)}`;
    drawPill(ctx, w / 2, y, pillText);
    y += 50;

    // ── TITLE ──
    ctx.save();
    ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 6;
    const title = getTitle(data);
    const titleLines = wrapText(ctx, title, cW);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, y + i * 62);
    });
    ctx.restore();
    y += titleLines.length * 62 + 14;

    // ── DESCRIPTION ──
    ctx.save();
    ctx.font = "28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const descLines = wrapText(ctx, getDescription(data), cW);
    descLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, y + i * 38);
    });
    ctx.restore();
    y += descLines.length * 38 + 10;

    // ── BADGE COUNT ──
    if (data.badgeCount && data.badgeCount > 0) {
      ctx.save();
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`${data.badgeCount} Badge${data.badgeCount > 1 ? "s" : ""} Earned`, w / 2, y);
      ctx.restore();
    }

    // ── BOTTOM: CTA + URL + handle ──
    ctx.save();
    ctx.textAlign = "center";

    ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("Join the journey → positivethots.com", w / 2, h - 80);

    ctx.font = "24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(HANDLE, w / 2, h - 42);

    ctx.restore();
  }

  return canvas;
}

export async function shareAchievement(
  canvas: HTMLCanvasElement,
  data: AchievementData,
): Promise<void> {
  trackEvent("achievement_share", { type: data.type });

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );

  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem" as any);
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const fileName = `achievement_${Date.now()}.png`;
      await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      const { Share } = await import("@capacitor/share" as any);
      await Share.share({
        title: getTitle(data),
        text: `${getDescription(data)} ${SHARE_URL}`,
        url: (await Filesystem.getUri({ path: fileName, directory: Directory.Cache })).uri,
      });
      return;
    } catch {
      // Fall through to web share
    }
  }

  if (navigator.share && navigator.canShare) {
    const file = new File([blob], "achievement.png", { type: "image/png" });
    const shareData = { files: [file], title: getTitle(data), text: `${getDescription(data)} ${SHARE_URL}` };
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled
      }
    }
  }

  downloadCanvas(canvas);
}

export function downloadCanvas(canvas: HTMLCanvasElement) {
  const link = document.createElement("a");
  link.download = `positive-thots-achievement-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
