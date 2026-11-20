/**
 * Ограничение попыток входа: не более MAX неудачных попыток за окно WINDOW_MS
 * для пары «email + IP». Хранится в памяти процесса — для нескольких
 * экземпляров приложения нужен общий стор (Redis), см. PROGRESS.md.
 */
const MAX = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, number[]>();

const recent = (key: string, now: number) => (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

export function isLocked(key: string, now = Date.now()): boolean {
  return recent(key, now).length >= MAX;
}

export function recordFailure(key: string, now = Date.now()) {
  attempts.set(key, [...recent(key, now), now]);
  if (attempts.size > 10_000) for (const [k, v] of attempts) if (!v.some((t) => now - t < WINDOW_MS)) attempts.delete(k);
}

export function resetAttempts(key: string) {
  attempts.delete(key);
}
