/** Unknown or empty curricula must never imply completion. */
export function hasEveryBadge(count: number, total: number | undefined): boolean {
  return total !== undefined && total > 0 && count >= total;
}

export function eligibleEarnedFrames(frames: string[], count: number, total: number | undefined): string[] {
  return frames.filter(frame => frame !== "educator" || hasEveryBadge(count, total));
}