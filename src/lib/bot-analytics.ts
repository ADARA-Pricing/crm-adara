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

type MetricSelector = (record: AnalyticsRecord) => number | null | undefined;
type GroupedMetricRecord = AnalyticsRecord & { argentinaDate: string; newUsersAggregationLimited: boolean };

export function argentinaAnalyticsDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function sumExact(records: AnalyticsRecord[], select: MetricSelector) {
  const values = records.map(select);
  return values.length && values.every((value): value is number => value != null) ? values.reduce((total, value) => total + value, 0) : null;
}

// Botpress may split a calendar day in several raw periods. The CRM keeps those
// records intact for the technical table and builds this separate, display-only view.
export function groupAnalyticsByArgentinaDay(records: AnalyticsRecord[]): GroupedMetricRecord[] {
  const buckets = new Map<string, AnalyticsRecord[]>();
  for (const record of records) {
    const day = argentinaAnalyticsDate(record.startDateTimeUtc);
    buckets.set(day, [...(buckets.get(day) || []), record]);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([argentinaDate, source]) => {
    const first = source[0];
    const metric = (select: MetricSelector) => sumExact(source, select);
    // New-user buckets can be cumulative on some Botpress periods. We only show
    // a daily value when exactly one raw period represents that day.
    const newUsersAggregationLimited = source.length > 1;
    return {
      ...first,
      startDateTimeUtc: `${argentinaDate}T00:00:00-03:00`,
      endDateTimeUtc: `${argentinaDate}T23:59:59-03:00`,
      conversationsCreated: metric(record => record.conversationsCreated),
      sessions: metric(record => record.sessions),
      newUsers: newUsersAggregationLimited ? null : first.newUsers,
      userMessages: metric(record => record.userMessages),
      botMessages: metric(record => record.botMessages),
      llm: source.some(record => record.llm == null) ? null : {
        calls: metric(record => record.llm?.calls),
        errors: metric(record => record.llm?.errors),
        inputTokens: metric(record => record.llm?.inputTokens),
        outputTokens: metric(record => record.llm?.outputTokens),
        cost: { sum: metric(record => record.llm?.cost?.sum) },
      },
      argentinaDate,
      newUsersAggregationLimited,
    };
  });
}

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
