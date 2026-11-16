export function formatAriary(value) {
  const n = Math.round(Number(value) || 0);
  return `${n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} Ar`;
}

export function madagascarNow() {
  return new Date(Date.now() + 3 * 3600 * 1000);
}

export function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return isoDay(madagascarNow());
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDay(d);
}

export function addMonthsDate(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function formatDay(iso) {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  const s = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDayShort(iso) {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function isBeforeDeadline(hour = 21, minute = 0) {
  const now = madagascarNow();
  if (now.getUTCHours() < hour) return true;
  if (now.getUTCHours() === hour) return now.getUTCMinutes() < minute;
  return false;
}

export function firstAvailableDate(hour = 21, minute = 0) {
  const today = todayIso();
  return isBeforeDeadline(hour, minute) ? addDays(today, 1) : addDays(today, 2);
}

export function isToday(iso) {
  return String(iso).slice(0, 10) === todayIso();
}

export function weeksUntil(date) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (7 * 24 * 3600 * 1000)));
}

export function formatRef() {
  const d = madagascarNow();
  const stamp = `${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return `PAO-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}