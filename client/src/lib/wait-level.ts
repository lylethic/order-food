export type WaitLevel = 'Low' | 'Medium' | 'High';

export interface WaitInfo {
  waitTimeMinutes: number;
  waitLevel: WaitLevel;
}

/** Thresholds in minutes */
const MEDIUM_THRESHOLD = 15;
const HIGH_THRESHOLD = 30;

export function computeWaitInfo(createdAt: string): WaitInfo {
  const waitTimeMinutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60_000,
  );
  const waitLevel: WaitLevel =
    waitTimeMinutes >= HIGH_THRESHOLD
      ? 'High'
      : waitTimeMinutes >= MEDIUM_THRESHOLD
        ? 'Medium'
        : 'Low';
  return { waitTimeMinutes, waitLevel };
}

export const WAIT_LEVEL_STYLE: Record<WaitLevel, string> = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-rose-50 text-rose-700 border-rose-200',
};
