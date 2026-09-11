import { expect, it } from "vitest";
import { argentineDateToIso, isoToArgentineDate } from "./argentine-date-input";

it("converts Argentine calendar dates without changing the day", () => {
  expect(isoToArgentineDate("2026-09-11")).toBe("11/09/2026");
  expect(argentineDateToIso("11/09/2026")).toBe("2026-09-11");
});

it("rejects invalid or ambiguous date text", () => {
  expect(argentineDateToIso("31/02/2026")).toBe("");
  expect(argentineDateToIso("09/11/2026")).toBe("2026-11-09");
  expect(argentineDateToIso("2026-09-11")).toBe("");
});
