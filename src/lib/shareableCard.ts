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

const ACCENT_COLORS: Record<AchievementType, [string, string]> = {
  badge_earned: ["hsl(270, 60%, 50%)", "hsl(280, 80%, 65%)"],
  streak_milestone: ["hsl(25, 90%, 55%)", "hsl(340, 70%, 55%)"],
  tier_complete: ["hsl(270, 60%, 50%)", "hsl(320, 70%, 55%)"],
  mentor_earned: ["hsl(280, 80%, 65%)", "hsl(320, 70%, 55%)"],
  compatibility_score: ["hsl(320, 70%, 55%)", "hsl(270, 60%, 50%)"],
};

function getTitle(data: AchievementData): string {
  switch (data.type) {
    case "badge_earned":
      return "Badge Earned! 🎓";
    case "streak_milestone":
      return `🔥 ${data.streakDays}-Day Streak!`;
    case "tier_complete":
      return `${data.tierName} Complete! 💪`;
    case "mentor_earned":
      return "Positive Thots Mentor! 💜";
    case "compatibility_score":
      return `Top Match: ${data.compatibilityScore}%! 😍`;
  }
}

function getSubtitle(data: AchievementData): string {
  switch (data.type) {
    case "badge_earned":
      return `I completed my ${data.badgeName} badge on Positive Thots!`;
    case "streak_milestone":
      return `${data.streakDays} consecutive days of learning about healthy relationships!`;
    case "tier_complete":
      return `All ${data.tierName} badges complete on Positive Thots!`;
    case "mentor_earned":
      return "All 20 education badges complete — I'm officially a mentor!";
    case "compatibility_score":
      return "Found an incredible compatibility match on Positive Thots!";
  }
}

function getEmoji(data: AchievementData): string {
  switch (data.type) {
    case "badge_earned": return "🎓";
    case "streak_milestone": return "🔥";
    case "tier_complete": return "💪";
    case "mentor_earned": return "💜";
    case "compatibility_score": return "😍";
  }
}

function drawConfetti(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[]) {
  const shapes = 60;
  for (let i = 0; i < shapes; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.7;
    const size = 4 + Math.random() * 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.fillStyle = colors[i % colors.length];
    if (i % 3 === 0) {
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    } else if (i % 3 === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawSparkles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 2 + Math.random() * 4;
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.random() * 0.5;
    ctx.fillStyle = "white";
    // 4-point star
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.3, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.3, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x, y + size * 0.3);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y - size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

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

  const [accent1, accent2] = ACCENT_COLORS[data.type];
  const confettiColors = [
    "hsl(270, 60%, 50%)", "hsl(320, 70%, 55%)",
    "hsl(280, 80%, 65%)", "hsl(45, 85%, 55%)",
    "hsl(340, 65%, 55%)", "hsl(50, 90%, 60%)",
  ];

  // Background - dark theme
  ctx.fillStyle = "hsl(270, 25%, 8%)";
  ctx.fillRect(0, 0, w, h);

  // Gradient orbs
  const drawOrb = (cx: number, cy: number, r: number, color: string, alpha: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, color.replace(")", `, ${alpha})`).replace("hsl", "hsla"));
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  };
  drawOrb(w * 0.2, h * 0.3, 400, accent1, 0.3);
  drawOrb(w * 0.8, h * 0.5, 350, accent2, 0.25);
  drawOrb(w * 0.5, h * 0.8, 300, "hsl(270, 60%, 50%)", 0.15);

  // Confetti particles
  drawConfetti(ctx, w, h, confettiColors);
  drawSparkles(ctx, w, h);

  // Logo at top
  const logoY = format === "story" ? 140 : 80;
  if (logoImg) {
    const logoH = 80;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, (w - logoW) / 2, logoY - logoH / 2, logoW, logoH);
  } else {
    // Pacifico-style text fallback
    ctx.save();
    ctx.font = "bold 56px 'Pacifico', cursive";
    ctx.textAlign = "center";
    ctx.fillStyle = "hsl(275, 70%, 60%)";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.fillText("Positive Thots", w / 2, logoY);
    ctx.restore();
  }

  // Center content
  const centerY = h / 2;

  // Large emoji
  ctx.save();
  ctx.font = "120px serif";
  ctx.textAlign = "center";
  ctx.fillText(getEmoji(data), w / 2, centerY - 80);
  ctx.restore();

  // Achievement title
  ctx.save();
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 12;
  const title = getTitle(data);
  // Word wrap if needed
  const words = title.split(" ");
  let lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > w - 160) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, centerY + 20 + i * 76);
  });
  ctx.restore();

  // Subtitle
  ctx.save();
  ctx.font = "36px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(0, 0%, 100%, 0.7)";
  const subtitle = getSubtitle(data);
  const subWords = subtitle.split(" ");
  let subLines: string[] = [];
  let subCurrent = "";
  for (const word of subWords) {
    const test = subCurrent ? `${subCurrent} ${word}` : word;
    if (ctx.measureText(test).width > w - 200) {
      subLines.push(subCurrent);
      subCurrent = word;
    } else {
      subCurrent = test;
    }
  }
  if (subCurrent) subLines.push(subCurrent);
  const subStartY = centerY + 20 + lines.length * 76 + 40;
  subLines.forEach((line, i) => {
    ctx.fillText(line, w / 2, subStartY + i * 48);
  });
  ctx.restore();

  // Gradient accent bar
  const barY = format === "story" ? h - 300 : h - 180;
  const grad = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
  grad.addColorStop(0, accent1);
  grad.addColorStop(1, accent2);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.roundRect(w * 0.3, barY, w * 0.4, 4, 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Mascot (if available)
  if (mascotImg && format === "story") {
    const mascotH = 200;
    const mascotW = (mascotImg.width / mascotImg.height) * mascotH;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(mascotImg, w - mascotW - 60, barY - mascotH + 20, mascotW, mascotH);
    ctx.globalAlpha = 1;
  }

  // Bottom URL
  ctx.save();
  ctx.font = "28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(0, 0%, 100%, 0.4)";
  ctx.fillText("positivethots.app", w / 2, h - 80);
  ctx.restore();

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

  // Try native share first
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
        text: `${getSubtitle(data)} ${SHARE_URL}`,
        url: (await Filesystem.getUri({ path: fileName, directory: Directory.Cache })).uri,
      });
      return;
    } catch {
      // Fall through to web share
    }
  }

  // Web Share API
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], "achievement.png", { type: "image/png" });
    const shareData = { files: [file], title: getTitle(data), text: `${getSubtitle(data)} ${SHARE_URL}` };
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or error — fall through to download
      }
    }
  }

  // Fallback: download
  downloadCanvas(canvas);
}

export function downloadCanvas(canvas: HTMLCanvasElement) {
  const link = document.createElement("a");
  link.download = `positive-thots-achievement-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
