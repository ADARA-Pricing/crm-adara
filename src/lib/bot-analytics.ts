import { z } from "zod";

const metric = z.number().finite().nonnegative().nullish();
export const analyticsSchema = z.object({ records: z.array(z.object({
  startDateTimeUtc: z.string().datetime(), endDateTimeUtc: z.string().datetime(),
  conversationsCreated: metric, sessions: metric, newUsers: metric,
  userMessages: metric, botMessages: metric,
  llm: z.object({ calls: metric, errors: metric, inputTokens: metric, outputTokens: metric,
    cost: z.object({ sum: metric }).nullish(),
  }).nullish(),
})) });
export type AnalyticsRecord = z.infer<typeof analyticsSchema>["records"][number];

// Missing metrics must never be silently turned into zero or partial totals.
export function totalMetric(records: AnalyticsRecord[], select: (r: AnalyticsRecord) => number | null | undefined): number | null {
  if (!records.length) return null;
  const values = records.map(select);
  return values.some(v => v == null) ? null : (values as number[]).reduce((a, b) => a + b, 0);
}
export function ratio(n: number | null, d: number | null) {
  return n == null || d == null || d <= 0 ? null : n / d;
}
export function analyticsRange(params: { days?: string; from?: string; to?: string }, now = new Date()) {
  // Botpress groups analytics in UTC. Use the same calendar for all comparisons.
  const today = now.toISOString().slice(0, 10);
  const days = params.days === "7" ? 7 : 30;
  const fallbackStart = new Date(`${today}T00:00:00.000Z`);
  fallbackStart.setUTCDate(fallbackStart.getUTCDate() - days + 1);
  const valid = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  const custom = params.days === "custom";
  if (custom && (!valid(params.from) || !valid(params.to) || params.from > params.to || params.to > today || Date.parse(params.to) - Date.parse(params.from) > 89 * 86400000)) {
    return { error: "Elegí un rango válido de hasta 90 días, sin fechas futuras." } as const;
  }
  const from = custom ? params.from! : fallbackStart.toISOString().slice(0, 10);
  const to = custom ? params.to! : today;
  return { from, to, start: `${from}T00:00:00.000Z`, end: `${to}T23:59:59.999Z`, days: custom ? "custom" : String(days) } as const;
}
