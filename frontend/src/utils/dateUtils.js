/**
 * Formats a Date object to YYYY-MM-DD string using local system timezone.
 * Avoids the UTC rollback bug caused by .toISOString() between 12:00 AM and 5:30 AM in India (UTC+5:30).
 */
export function toLocalDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toLocalDateISO(new Date());
}

export function monthStartISO(date = new Date()) {
  return toLocalDateISO(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function monthEndISO(date = new Date()) {
  return toLocalDateISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}
