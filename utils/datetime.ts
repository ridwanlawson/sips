export function toBackendDateTime(v?: string) {
  if (!v) return "";
  const [date, time = ""] = v.split("T");
  const timeWithSeconds = time.length <= 5 ? `${time}:00` : time;
  return `${date} ${timeWithSeconds}`;
}
