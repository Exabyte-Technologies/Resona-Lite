/** An absolute deadline keeps the timer accurate across app suspension. */
export function timerDeadline(minutes: number | null, now = Date.now()): number | null {
  return minutes === null ? null : now + Math.max(1, Math.min(720, minutes)) * 60_000;
}
export function timerRemaining(deadline: number | null, now = Date.now()): number {
  return deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function timerExpired(deadline: number | null, now = Date.now()): boolean {
  return deadline !== null && now >= deadline;
}
export function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), rest = seconds % 60;
  return [ ...(hours ? [hours] : []), hours ? String(minutes).padStart(2,'0') : minutes, String(rest).padStart(2,'0') ].join(':');
}
