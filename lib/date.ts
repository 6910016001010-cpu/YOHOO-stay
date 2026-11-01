const DAY_MS = 86_400_000;
// Thailand has no daylight saving time; a fixed +07:00 offset is always correct.
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

export function toISODate(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function todayISO(): string {
  return new Date(Date.now() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  return toISODate(new Date(date.getTime() + days * DAY_MS));
}

export function diffDays(from: string, to: string): number {
  const start = parseISODate(from);
  const end = parseISODate(to);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export function isBefore(a: string, b: string): boolean {
  return a < b;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function formatThaiDate(value: string, style: "short" | "medium" | "long" = "medium"): string {
  const date = parseISODate(value);
  if (!date) return value;
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { day: "numeric", month: "short", timeZone: "UTC" }
      : style === "long"
        ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
        : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("th-TH", { ...options, calendar: "gregory" }).format(date);
}

export function formatThaiDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    calendar: "gregory",
  }).format(date);
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  return `${formatThaiDate(checkIn, "short")} – ${formatThaiDate(checkOut, "medium")}`;
}

export function monthKey(date: Date = new Date()): string {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 7);
}

export function monthBounds(month: string): { start: string; end: string; daysInMonth: number } {
  const [year, m] = month.split("-").map(Number);
  const start = `${year}-${String(m).padStart(2, "0")}-01`;
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { start, end: addDays(start, daysInMonth), daysInMonth };
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function formatMonthThai(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1, 1));
  return new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    calendar: "gregory",
  }).format(date);
}

export function eachDate(start: string, endExclusive: string): string[] {
  const total = diffDays(start, endExclusive);
  return Array.from({ length: Math.max(total, 0) }, (_, i) => addDays(start, i));
}

export function formatWeekdayShort(value: string): string {
  const date = parseISODate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", { weekday: "short", timeZone: "UTC" }).format(date);
}

export function dateDay(value: string): number {
  const date = parseISODate(value);
  return date ? date.getUTCDate() : 0;
}
