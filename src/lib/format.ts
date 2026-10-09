// Shared formatting helpers: JPY prices and relative timestamps.

export function formatJpy(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(n);
}

export function formatJpyShort(price: string | number): string {
  const n = typeof price === 'number' ? price : Number(price);
  if (Number.isNaN(n)) return String(price);
  return `¥${n.toLocaleString('en-US')}`;
}

function diffParts(iso: string): { ms: number; valid: boolean } {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { ms: 0, valid: false };
  return { ms: Date.now() - t, valid: true };
}

export function timeAgo(iso: string | null | undefined, neverLabel = ''): string {
  if (!iso) return neverLabel;
  const { ms, valid } = diffParts(iso);
  if (!valid) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export const UPDATES_DEFAULT_LIMIT = 50;
export const UPDATES_MAX_LIMIT = 500;
export const UPDATES_PAGE_STEP = 50;
