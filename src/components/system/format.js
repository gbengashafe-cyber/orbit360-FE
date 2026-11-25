/*
 * Display formatting for dates and money (DESIGN.md §3 and §4).
 * Interface dates read "02 Dec 2026", always in Africa/Lagos. Notification messages from the backend keep
 * their own DD/MM/YYYY copy and are shown as received.
 */

export const APP_TIMEZONE = 'Africa/Lagos';

// Own month names: en-GB Intl output uses "Sept", which breaks the three-letter rule.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

const pad = (value) => String(value).padStart(2, '0');

/** { year, month (1-12), day, hour, minute } in Africa/Lagos, or null for empty/invalid input. */
export const toLagosParts = (value) => {
  if (value === null || value === undefined || value === '') return null;

  // A plain calendar date ('2026-12-02') is already a Lagos date: don't shift it through a timezone.
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [, year, month, day] = value.match(DATE_ONLY);
    return { year: +year, month: +month, day: +day, hour: 0, minute: 0 };
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute };
};

/** "02 Dec 2026". Returns `fallback` ('—' by default) for empty or invalid values. */
export const formatDate = (value, { fallback = '—' } = {}) => {
  const parts = toLagosParts(value);
  if (!parts) return fallback;
  return `${pad(parts.day)} ${MONTHS[parts.month - 1]} ${parts.year}`;
};

/** "02 Dec 2026, 14:30". */
export const formatDateTime = (value, { fallback = '—' } = {}) => {
  const parts = toLagosParts(value);
  if (!parts) return fallback;
  return `${pad(parts.day)} ${MONTHS[parts.month - 1]} ${parts.year}, ${pad(parts.hour)}:${pad(parts.minute)}`;
};

/** "01 Dec 2026 – 28 Feb 2027"; a single date when both ends are the same day. */
export const formatDateRange = (from, to, { fallback = '—' } = {}) => {
  const start = formatDate(from, { fallback: '' });
  const end = formatDate(to, { fallback: '' });
  if (!start && !end) return fallback;
  if (!end || start === end) return start || end;
  if (!start) return end;
  return `${start} – ${end}`;
};

/** 'YYYY-MM-DD' for a Date (local calendar date), for API payloads and form values. */
export const toIsoDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Working days (Mon–Fri) between two dates inclusive, skipping the given holidays ('YYYY-MM-DD'). */
export const countWorkingDays = (from, to, holidays = []) => {
  const start = from instanceof Date ? from : from ? new Date(`${from}T00:00:00`) : null;
  const end = to instanceof Date ? to : to ? new Date(`${to}T00:00:00`) : start;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  const skip = new Set(holidays);
  let count = 0;
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekday !== 0 && weekday !== 6 && !skip.has(toIsoDate(day))) count += 1;
  }
  return count;
};

const moneyFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "₦1,250,000.00". Use in right-aligned, tabular-nums cells. */
export const formatCurrency = (amount, { fallback = '—' } = {}) => {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  const formatted = moneyFormatter.format(Math.abs(value));
  return value < 0 ? `-₦${formatted}` : `₦${formatted}`;
};
