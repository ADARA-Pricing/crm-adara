import { describe, it, expect } from "vitest";
import { analyticsRange, analyticsSchema, ratio, totalMetric } from "./bot-analytics";

const record = { startDateTimeUtc: "2026-09-07T00:00:00.000Z", endDateTimeUtc: "2026-09-07T23:59:59.999Z" };
describe("Bot analytics", () => {
  it("uses inclusive UTC calendars", () => expect(analyticsRange({ days: "7" }, new Date("2026-09-07T15:00:00Z"))).toMatchObject({ from: "2026-09-01", to: "2026-09-07" }));
  it("defaults to thirty days", () => expect(analyticsRange({}, new Date("2026-09-07T15:00:00Z"))).toMatchObject({ from: "2026-08-09" }));
  it.each([{ from: "2026-02-30", to: "2026-03-01" }, { from: "2026-09-08", to: "2026-09-07" }, { from: "2026-01-01", to: "2026-09-07" }, { from: "2026-09-07", to: "2026-10-01" }])("rejects invalid range %j", p => expect(analyticsRange({ days: "custom", ...p }, new Date("2026-09-07"))).toHaveProperty("error"));
  it("does not convert absent data to zero", () => { expect(totalMetric([], r => r.userMessages)).toBeNull(); expect(totalMetric([record, { ...record, userMessages: 3 }], r => r.userMessages)).toBeNull(); });
  it("preserves real zero and sums USD without nanodollar conversion", () => { expect(totalMetric([{ ...record, userMessages: 0 }], r => r.userMessages)).toBe(0); expect(totalMetric([{ ...record, llm: { cost: { sum: 0.2 } } }, { ...record, llm: { cost: { sum: 0.3 } } }], r => r.llm?.cost?.sum)).toBe(0.5); });
  it("guards zero and missing denominators", () => { expect(ratio(1,0)).toBeNull(); expect(ratio(null,2)).toBeNull(); expect(ratio(1,2)).toBe(0.5); });
  it("rejects malformed or negative metrics", () => expect(analyticsSchema.safeParse({ records: [{ ...record, userMessages: -1 }] }).success).toBe(false));
  it("accepts optional llm data without inventing it", () => expect(analyticsSchema.parse({ records: [record] }).records[0].llm).toBeUndefined());
});
