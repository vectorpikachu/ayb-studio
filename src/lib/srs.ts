export type ReviewGrade = 0 | 1 | 2 | 3;

export type ReviewState = {
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  due: string;
  lastReviewed: string;
  lastGrade: ReviewGrade;
};

export const AGAIN_DELAY_MINUTES = 10;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * A compact SM-2 inspired scheduler. `interval` is expressed in days, which
 * keeps stored state readable and easy to inspect in the local JSON database.
 */
export function scheduleReview(
  previous: ReviewState | null,
  grade: ReviewGrade,
  now = new Date(),
): ReviewState {
  const base = previous ?? {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
  };

  let ease = base.ease;
  let interval = base.interval;
  let repetitions = base.repetitions;
  let lapses = base.lapses;

  if (grade === 0) {
    ease = clamp(ease - 0.2, 1.3, 3);
    interval = AGAIN_DELAY_MINUTES / (24 * 60);
    repetitions = 0;
    lapses += 1;
  } else if (grade === 1) {
    ease = clamp(ease - 0.15, 1.3, 3);
    interval =
      base.repetitions === 0 ? 0.25 : Math.max(1, Math.round(base.interval * 1.2));
    repetitions += 1;
  } else if (grade === 2) {
    interval = base.repetitions === 0 ? 1 : Math.max(1, Math.round(base.interval * ease));
    repetitions += 1;
  } else {
    ease = clamp(ease + 0.15, 1.3, 3);
    interval =
      base.repetitions === 0 ? 4 : Math.max(2, Math.round(base.interval * ease * 1.3));
    repetitions += 1;
  }

  interval = clamp(interval, 0, 365);
  const due =
    grade === 0
      ? new Date(now.getTime() + AGAIN_DELAY_MINUTES * MINUTE_MS)
      : new Date(now.getTime() + interval * DAY_MS);

  return {
    ease,
    interval,
    repetitions,
    lapses,
    due: due.toISOString(),
    lastReviewed: now.toISOString(),
    lastGrade: grade,
  };
}

export function formatDueDistance(due: string, now = new Date()): string {
  const diff = Math.max(0, new Date(due).getTime() - now.getTime());
  const minutes = diff / MINUTE_MS;
  const hours = minutes / 60;
  const days = hours / 24;

  if (days < 1) {
    if (hours < 1) return `${Math.max(1, Math.round(minutes))} 分钟后`;
    return `${Math.max(1, Math.round(hours))} 小时后`;
  }
  if (days < 30) return `${Math.max(1, Math.round(days))} 天后`;
  if (days < 365) return `${Math.max(1, Math.round(days / 30))} 个月后`;
  return `${Math.max(1, Math.round(days / 365))} 年后`;
}

export function previewSchedule(
  previous: ReviewState | null,
  grade: ReviewGrade,
  now = new Date(),
): string {
  const next = scheduleReview(previous, grade, now);
  return formatDueDistance(next.due, now);
}
