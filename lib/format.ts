const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDate(value: string | number | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDate(value: string | number | Date | null | undefined) {
  const date = toDate(value);
  if (!date) return "N/A";
  return `${pad2(date.getUTCDate())} ${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateTime(value: string | number | Date | null | undefined) {
  const date = toDate(value);
  if (!date) return "N/A";
  return `${formatDate(date)} ${formatTime(value)}`;
}

export function formatTime(value: string | number | Date | null | undefined) {
  const date = toDate(value);
  if (!date) return "N/A";
  return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}

export function formatMonthYear(date: Date) {
  return `${MONTH_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatWeekday(value: string | number | Date | null | undefined) {
  const date = toDate(value);
  if (!date) return "N/A";
  return WEEKDAY_SHORT[date.getUTCDay()];
}

export function formatPKR(value: number) {
  const rounded = Math.round(Number(value) || 0);
  return `PKR ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
