type RawRange = { days?: string | string[]; from?: string | string[]; to?: string | string[] };

const one = (value: string | string[] | undefined) => typeof value === "string" ? value.trim() : "";
const day = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00-03:00`);
  return Number.isFinite(date.getTime()) && new Date(date.getTime() - 10800000).toISOString().slice(0, 10) === value ? date : null;
};
const dateInput = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/** Read-only reporting window. `end` is exclusive so the selected final day is complete. */
export function crmResultsRange(raw: RawRange, now = new Date()) {
  const requestedDays = one(raw.days);
  const from = one(raw.from), to = one(raw.to);
  const custom = requestedDays === "custom";
  const startDay = custom ? day(from) : null;
  const endDay = custom ? day(to) : null;
  if (custom && (!startDay || !endDay || startDay > endDay)) return { error: "Ingresá un rango de fechas válido.", days: "custom" as const, from, to };
  if (custom) return { days: "custom" as const, from, to, start: startDay!, end: new Date(endDay!.getTime() + 86400000) };
  const days = requestedDays === "7" ? 7 : requestedDays === "90" ? 90 : 30;
  const end = now;
  const start = new Date(now.getTime() - days * 86400000);
  return { days: String(days), from: dateInput(start), to: dateInput(now), start, end };
}
