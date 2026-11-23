import type { Frequency } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date → YYYY-MM-DD */
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DD → local Date at midnight */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = () => toISO(new Date());

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDate(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayHeader(iso: string): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === todayISO()) return 'Today';
  if (iso === toISO(yesterday)) return 'Yesterday';
  const d = fromISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "YYYY-MM" key of a date string */
export const monthKey = (iso: string) => iso.slice(0, 7);
export const currentMonthKey = () => monthKey(todayISO());

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Next occurrence; monthly/yearly clamp to month end (31 Jan → 28/29 Feb). */
export function addFrequency(iso: string, freq: Frequency): string {
  const d = fromISO(iso);
  if (freq === 'daily') {
    d.setDate(d.getDate() + 1);
    return toISO(d);
  }
  if (freq === 'weekly') {
    d.setDate(d.getDate() + 7);
    return toISO(d);
  }
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + (freq === 'monthly' ? 1 : 12), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toISO(target);
}

/** Whole days from today until the given date (negative = overdue). */
export function daysUntil(iso: string): number {
  const ms = fromISO(iso).getTime() - fromISO(todayISO()).getTime();
  return Math.round(ms / 86_400_000);
}
