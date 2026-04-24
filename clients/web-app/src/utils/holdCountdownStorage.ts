const STORAGE_KEY = "travelhub_hold_countdown_v1";

export type PersistedHoldCountdown = { v: 1; userId: number; endMs: number };

export function persistHoldCountdownEnd(userId: number, endMs: number): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ v: 1, userId, endMs } satisfies PersistedHoldCountdown),
  );
}

export function readHoldCountdownEnd(): PersistedHoldCountdown | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    if (
      o.v !== 1 ||
      typeof o.userId !== "number" ||
      typeof o.endMs !== "number" ||
      !Number.isFinite(o.endMs)
    ) {
      return null;
    }
    return { v: 1, userId: o.userId, endMs: o.endMs };
  } catch {
    return null;
  }
}

export function clearHoldCountdownEnd(): void {
  localStorage.removeItem(STORAGE_KEY);
}
