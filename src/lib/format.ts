export const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
export function todayLagos() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDay(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function validDate(iso: unknown): iso is string {
  return (
    typeof iso === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(iso) &&
    Number.isFinite(Date.parse(`${iso}T12:00:00Z`)) &&
    new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10) === iso
  );
}
export function shortDate(iso: string) {
  return validDate(iso)
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Africa/Lagos",
      }).format(new Date(`${iso}T12:00:00Z`))
    : "Choose a date";
}
export const daysBetween = (first: string, last: string) =>
  Math.round(
    (Date.parse(`${last}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) /
      86400000,
  );
