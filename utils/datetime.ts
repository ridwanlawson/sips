export function toBackendDateTime(v?: string) {
  if (!v) return "";
  const [date, time = ""] = v.split("T");
  const timeWithSeconds = time.length <= 5 ? `${time}:00` : time;
  return `${date} ${timeWithSeconds}`;
}

export function getTodayISO(): string {
  const now = new Date();
  return formatDateISO(now);
}

export function formatDateISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateDMY(raw: string | null | undefined): string {
  if (!raw) return "-";
  const trimmed = raw.trim();
  if (!trimmed) return "-";
  const onlyDate = trimmed.split(" ")[0];
  const parts = onlyDate?.split("-");
  if (!parts || parts.length !== 3) return trimmed;
  const [y, m, d] = parts;
  if (!y || !m || !d) return trimmed;
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
}
