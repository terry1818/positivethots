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

const APP_URL = "https://positivethots.app";
const SHARE_URL = `${APP_URL}?utm_source=achievement_share`;
const HANDLE = "@think_positiveth0ts";
const TAGLINE = "Learn first. Connect better.";
const PITCH = "An education-first dating app for the ethically non-monogamous community";

// Accent colors per achievement type: [primary glow, secondary glow]
const ACCENT_COLORS: Record<AchievementType, [string, string]> = {
  badge_earned: ["rgba(139,92,246,0.35)", "rgba(168,85,247,0.20)"],       // purple
  streak_milestone: ["rgba(245,158,11,0.35)", "rgba(251,146,60,0.20)"],   // amber/orange
  tier_complete: ["rgba(234,179,8,0.35)", "rgba(250,204,21,0.20)"],       // gold
  mentor_earned: ["rgba(168,85,247,0.35)", "rgba(236,72,153,0.20)"],      // rainbow-ish
  compatibility_score: ["rgba(236,72,153,0.35)", "rgba(139,92,246,0.20)"],// pink
};

const PILL_STYLES: Record<AchievementType, { emoji: string; label: string; bg: string; text: string; border: string }> = {
  badge_earned: { emoji: "🎓", label: "Badge Earned", bg: "rgba(139,92,246,0.2)", text: "rgb(196,167,255)", border: "rgba(139,92,246,0.4)" },
  streak_milestone: { emoji: "🔥", label: "Streak!", bg: "rgba(245,158,11,0.2)", text: "rgb(253,186,73)", border: "rgba(245,158,11,0.4)" },
  tier_complete: { emoji: "🛡️", label: "Tier Complete", bg: "rgba(234,179,8,0.2)", text: "rgb(250,204,21)", border: "rgba(234,179,8,0.4)" },
  mentor_earned: { emoji: "⭐", label: "Master Scholar", bg: "rgba(168,85,247,0.2)", text: "rgb(196,167,255)", border: "rgba(168,85,247,0.4)" },
  compatibility_score: { emoji: "💜", label: "First Connection", bg: "rgba(236,72,153,0.2)", text: "rgb(244,114,182)", border: "rgba(236,72,153,0.4)" },
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

function getPillData(data: AchievementData) {
  const style = PILL_STYLES[data.type];
  if (data.type === "streak_milestone") {
    return { ...style, label: `${data.streakDays}-Day Streak!` };
  }
  if (data.type === "tier_complete" && data.tierName === "Foundation") {
    return { ...style, emoji: "🛡️", label: "Foundation Complete" };
  }
  return style;
}

// ── Drawing helpers ──

function drawRichBackground(ctx: CanvasRenderingContext2D, w: number, h: number, accentType: AchievementType) {
  // Rich gradient background (dark purple → near-black → dark purple)
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#1a0533");
  bg.addColorStop(0.45, "#0d0015");
  bg.addColorStop(0.55, "#0d0015");
  bg.addColorStop(1, "#1a0533");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid overlay
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();

  // Glow orbs
  const [accent1, accent2] = ACCENT_COLORS[accentType];
  const drawOrb = (cx: number, cy: number, r: number, color: string) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  };
  drawOrb(w * 0.8, h * 0.15, 350, "rgba(147,51,234,0.12)");  // upper-right purple
  drawOrb(w * 0.15, h * 0.8, 300, "rgba(236,72,153,0.08)");   // lower-left pink
  drawOrb(w * 0.5, h * 0.5, 250, accent1);                     // center accent glow
  drawOrb(w * 0.3, h * 0.65, 200, accent2);                    // secondary glow
}

function drawScatteredDots(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const colors = [
    "rgba(168,85,247,0.6)", "rgba(236,72,153,0.5)", "rgba(250,204,21,0.5)",
    "rgba(139,92,246,0.5)", "rgba(244,114,182,0.4)", "rgba(253,186,73,0.4)",
  ];
  // 18-22 scattered dots
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 3 + Math.random() * 4;
    ctx.save();
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.3 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    ctx.shadowColor = colors[i % colors.length];
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

function drawStarSparkles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 5-6 small white star sparkles around the middle
  const positions = [
    { x: w * 0.12, y: h * 0.32 }, { x: w * 0.88, y: h * 0.38 },
    { x: w * 0.15, y: h * 0.58 }, { x: w * 0.85, y: h * 0.55 },
    { x: w * 0.25, y: h * 0.42 }, { x: w * 0.78, y: h * 0.48 },
  ];
  for (const pos of positions) {
    const size = 3 + Math.random() * 3;
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.random() * 0.4;
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 6;
    // 4-point star
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - size);
    ctx.lineTo(pos.x + size * 0.25, pos.y);
    ctx.lineTo(pos.x, pos.y + size);
    ctx.lineTo(pos.x - size * 0.25, pos.y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pos.x - size, pos.y);
    ctx.lineTo(pos.x, pos.y + size * 0.25);
    ctx.lineTo(pos.x + size, pos.y);
    ctx.lineTo(pos.x, pos.y - size * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawGradientLine(ctx: CanvasRenderingContext2D, cx: number, y: number, lineWidth: number) {
  const grad = ctx.createLinearGradient(cx - lineWidth / 2, 0, cx + lineWidth / 2, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.2, "rgba(139,92,246,0.6)");
  grad.addColorStop(0.5, "rgba(236,72,153,0.7)");
  grad.addColorStop(0.8, "rgba(139,92,246,0.6)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - lineWidth / 2, y, lineWidth, 3);
}

function drawPill(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, pill: ReturnType<typeof getPillData>) {
  ctx.save();
  ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
  const label = `${pill.emoji}  ${text}`;
  const metrics = ctx.measureText(label);
  const pw = metrics.width + 60;
  const ph = 56;
  const px = cx - pw / 2;
  const py = cy - ph / 2;

  // Pill background
  ctx.fillStyle = pill.bg;
  ctx.strokeStyle = pill.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, ph / 2);
  ctx.fill();
  ctx.stroke();

  // Pill text
  ctx.fillStyle = pill.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + 2);
  ctx.restore();
}

function drawGlowingBadgeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, emoji: string, accentType: AchievementType) {
  const radius = 80;
  const [accent] = ACCENT_COLORS[accentType];

  // Outer glow
  ctx.save();
  const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.5);
  outerGlow.addColorStop(0, accent);
  outerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = outerGlow;
  ctx.fillRect(cx - radius * 2.5, cy - radius * 2.5, radius * 5, radius * 5);
  ctx.restore();

  // Glowing ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(167,139,250,0.6)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(139,92,246,0.5)";
  ctx.shadowBlur = 25;
  ctx.stroke();
  // Second layer
  ctx.shadowBlur = 50;
  ctx.shadowColor = "rgba(139,92,246,0.25)";
  ctx.stroke();
  ctx.restore();

  // Dark circle fill
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(13,0,21,0.6)";
  ctx.fill();
  ctx.restore();

  // Large emoji centered
  ctx.save();
  ctx.font = "80px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + 4);
  ctx.restore();
}

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

// ── Main render ──

export function generateAchievementCard(
  data: AchievementData,
  format: "story" | "square" = "story",
  mascotImg?: HTMLImageElement | null,
  logoImg?: HTMLImageElement | null,
): HTMLCanvasElement {
  const w = 1080;
  const h = format === "story" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const isStory = format === "story";

  // ── Background ──
  drawRichBackground(ctx, w, h, data.type);
  drawScatteredDots(ctx, w, h);
  drawStarSparkles(ctx, w, h);

  const pill = getPillData(data);

  if (isStory) {
    // ════════════════════════════════════════
    // STORY FORMAT (9:16)
    // TOP ZONE: 0 → ~480 (25%)
    // MIDDLE ZONE: ~480 → ~1440 (50%)
    // BOTTOM ZONE: ~1440 → 1920 (25%)
    // ════════════════════════════════════════

    // ── TOP ZONE ──
    // Wordmark
    ctx.save();
    ctx.font = "62px 'Pacifico', cursive";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.fillText("Positive Thots", w / 2, 160);
    ctx.restore();

    // Tagline
    ctx.save();
    ctx.font = "30px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(196,167,255,0.9)";
    ctx.fillText(TAGLINE, w / 2, 220);
    ctx.restore();

    // Gradient separator
    drawGradientLine(ctx, w / 2, 250, w * 0.6);

    // ── MIDDLE ZONE ──
    const midY = h * 0.48;

    // Glowing badge icon
    drawGlowingBadgeIcon(ctx, w / 2, midY - 100, pill.emoji, data.type);

    // Achievement title (actual badge name)
    ctx.save();
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    const title = getTitle(data);
    const titleLines = wrapText(ctx, title, w - 160);
    const titleStartY = midY + 40;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, titleStartY + i * 76);
    });
    ctx.restore();

    // Achievement pill below title
    const pillY = titleStartY + titleLines.length * 76 + 40;
    drawPill(ctx, w / 2, pillY, pill.label, pill);

    // Description text
    ctx.save();
    ctx.font = "34px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(209,213,219,0.9)";
    const desc = getDescription(data);
    const descLines = wrapText(ctx, desc, w - 200);
    const descStartY = pillY + 60;
    descLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, descStartY + i * 46);
    });
    ctx.restore();

    // Curiosity pitch line (italic)
    ctx.save();
    ctx.font = "italic 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(196,167,255,0.8)";
    const pitchLines = wrapText(ctx, PITCH, w - 180);
    const pitchY = descStartY + descLines.length * 46 + 36;
    pitchLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, pitchY + i * 38);
    });
    ctx.restore();

    // ── BOTTOM ZONE ──
    const bottomY = h - 350;

    // Gradient separator
    drawGradientLine(ctx, w / 2, bottomY, w * 0.5);

    // Mascot on the left
    if (mascotImg) {
      const mascotH = 220;
      const mascotW = (mascotImg.width / mascotImg.height) * mascotH;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(mascotImg, 80, h - mascotH - 100, mascotW, mascotH);
      ctx.globalAlpha = 1;
    }

    // Right side: CTA + URL + handle
    const textX = mascotImg ? w * 0.6 : w / 2;
    const textAlign: CanvasTextAlign = mascotImg ? "center" : "center";
    const textAreaCenterX = mascotImg ? (w * 0.4 + w) / 2 : w / 2;

    ctx.save();
    ctx.textAlign = textAlign;

    // "Join the movement 💜"
    ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Join the movement 💜", textAreaCenterX, h - 260);

    // URL
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(167,139,250,1)";
    ctx.fillText("positivethots.app", textAreaCenterX, h - 200);

    // Handle
    ctx.font = "30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(156,163,175,0.8)";
    ctx.fillText(HANDLE, textAreaCenterX, h - 150);

    ctx.restore();

    // Bottom sparkle dots decoration
    const sparkleColors = ["rgba(139,92,246,0.5)", "rgba(236,72,153,0.4)", "rgba(250,204,21,0.4)"];
    for (let i = 0; i < 12; i++) {
      const sx = w * 0.15 + Math.random() * w * 0.7;
      const sy = h - 60 + Math.random() * 40 - 20;
      const sr = 2 + Math.random() * 3;
      ctx.save();
      ctx.fillStyle = sparkleColors[i % sparkleColors.length];
      ctx.globalAlpha = 0.4 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  } else {
    // ════════════════════════════════════════
    // SQUARE FORMAT (1:1)
    // Wordmark top-left, URL bottom-center
    // ════════════════════════════════════════

    // Top-left wordmark
    ctx.save();
    ctx.font = "42px 'Pacifico', cursive";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 6;
    ctx.fillText("Positive Thots", 60, 80);
    ctx.restore();

    // Tagline under wordmark
    ctx.save();
    ctx.font = "22px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(196,167,255,0.8)";
    ctx.fillText(TAGLINE, 62, 115);
    ctx.restore();

    // Center content
    const midY = h * 0.45;
    drawGlowingBadgeIcon(ctx, w / 2, midY - 60, pill.emoji, data.type);

    // Title
    ctx.save();
    ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    const title = getTitle(data);
    const titleLines = wrapText(ctx, title, w - 140);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, midY + 50 + i * 66);
    });
    ctx.restore();

    // Pill
    const pillY = midY + 50 + titleLines.length * 66 + 30;
    drawPill(ctx, w / 2, pillY, pill.label, pill);

    // Description
    ctx.save();
    ctx.font = "30px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(209,213,219,0.9)";
    const descLines = wrapText(ctx, getDescription(data), w - 180);
    const descY = pillY + 50;
    descLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, descY + i * 40);
    });
    ctx.restore();

    // Pitch line
    ctx.save();
    ctx.font = "italic 24px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(196,167,255,0.7)";
    const pitchLines = wrapText(ctx, PITCH, w - 160);
    const pitchY = descY + descLines.length * 40 + 24;
    pitchLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, pitchY + i * 32);
    });
    ctx.restore();

    // Mascot bottom-left (smaller)
    if (mascotImg) {
      const mH = 140;
      const mW = (mascotImg.width / mascotImg.height) * mH;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(mascotImg, 50, h - mH - 50, mW, mH);
      ctx.globalAlpha = 1;
    }

    // Bottom center: URL + handle
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(167,139,250,1)";
    ctx.fillText("positivethots.app", w / 2, h - 80);
    ctx.font = "26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(156,163,175,0.7)";
    ctx.fillText(HANDLE, w / 2, h - 40);
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
