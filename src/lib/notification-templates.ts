/**
 * Notification template system with branded emotional copy.
 * Uses variable ratio reinforcement — randomly selected copy variants.
 * 
 * BRAND RULES:
 * - "Send a Thot" / "Thot" (never "Super Like")
 * - "You Both Said Yes" (never "It's a Match")
 * - "Connect" (never "Swipe Right" / "Like")
 * - "Pass" (never "Swipe Left" / "Reject")
 * - "Thot Pack" (never "Super Like Pack")
 */

export interface NotificationTemplate {
  title: string;
  body: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getStreakAtRiskNotification(streakCount: number): NotificationTemplate {
  return {
    title: "Your streak is on the line! 🔥",
    body: pickRandom([
      `Don't let ${streakCount} days go to waste! Quick — finish a daily challenge 🔥`,
      `Your ${streakCount}-day streak misses you! Just one lesson to keep it alive 💜`,
      `⚡ ${streakCount} days and counting... unless today is the day it ends?`,
    ]),
  };
}

export function getStreakCriticalNotification(streakCount: number): NotificationTemplate {
  return {
    title: "Last chance! ⏰",
    body: `Your ${streakCount}-day streak ends at midnight. 2 minutes is all it takes!`,
  };
}

export function getStreakLostNotification(): NotificationTemplate {
  return {
    title: "We'll help you bounce back 💪",
    body: "Your streak reset, but your knowledge didn't. Start a new streak today!",
  };
}

export function getNewMatchNotification(matchName: string): NotificationTemplate {
  return {
    title: "You Both Said Yes! 💜",
    body: `${matchName} wants to connect with you. Say hello!`,
  };
}

export function getNewMessageNotification(senderName: string): NotificationTemplate {
  return {
    title: `${senderName} sent you a message`,
    body: "Tap to read and reply",
  };
}

export function getBadgeAlmostCompleteNotification(badgeName: string, percent: number): NotificationTemplate {
  return {
    title: "So close! 🎯",
    body: `You're ${percent}% through ${badgeName}. Finish it today?`,
  };
}

export function getInactive3DaysNotification(): NotificationTemplate {
  return {
    title: "We miss you! 🥺",
    body: pickRandom([
      "Your learning journey is waiting. Pick up where you left off!",
      "New connections are joining every day. Come see who's new! 💜",
    ]),
  };
}

export function getInactive7DaysNotification(): NotificationTemplate {
  return {
    title: "It's been a while...",
    body: "We saved your progress. Ready to jump back in? Just one lesson!",
  };
}

export function getWeeklySummaryNotification(xp: number, lessons: number, matches: number): NotificationTemplate {
  return {
    title: "Your week in review 📊",
    body: `You earned ${xp}XP, completed ${lessons} lessons, and made ${matches} new connections!`,
  };
}

export function getDailyChallengeNotification(): NotificationTemplate {
  return {
    title: "New daily challenge! 🎯",
    body: "Today's challenge is ready. Complete it for bonus XP!",
  };
}

/**
 * Check if notification should be sent based on quiet hours and preferences.
 * Quiet hours: 10pm-8am (except streak-critical at 10pm)
 * Max 3 notifications per day.
 */
export function shouldSendNotification(
  type: string,
  hour: number,
  dailyCount: number
): boolean {
  if (dailyCount >= 3) return false;
  
  const isQuietHours = hour >= 22 || hour < 8;
  if (isQuietHours && type !== "streak_critical") return false;

  return true;
}
