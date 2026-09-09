import { expect, it } from "vitest";
import { crmResultsRange } from "./crm-results-range";

it("uses the selected inclusive Argentina calendar range", () => {
  const range = crmResultsRange({ days: "custom", from: "2026-09-01", to: "2026-09-07" });
  expect(range).toMatchObject({ days: "custom", start: new Date("2026-09-01T03:00:00Z"), end: new Date("2026-09-08T03:00:00Z") });
});
it("rejects invalid or inverted custom ranges", () => {
  expect(crmResultsRange({ days: "custom", from: "2026-02-30", to: "2026-03-01" })).toHaveProperty("error");
  expect(crmResultsRange({ days: "custom", from: "2026-09-02", to: "2026-09-01" })).toHaveProperty("error");
});
it("keeps only supported preset windows", () => {
  expect(crmResultsRange({ days: "bad" }, new Date("2026-09-09T12:00:00Z"))).toMatchObject({ days: "30" });
  expect(crmResultsRange({ days: "90" }, new Date("2026-09-09T12:00:00Z"))).toMatchObject({ days: "90" });
});
