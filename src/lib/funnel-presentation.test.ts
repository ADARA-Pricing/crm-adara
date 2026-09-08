import { expect, it } from "vitest";
import { lastContactLabel, visibleFunnelStages } from "./funnel-presentation";

it("shows five active stages including physical pickup", () => {
  const stages = visibleFunnelStages(null).map(([id]) => id);
  expect(stages).toHaveLength(5);
  expect(stages).toContain("LOCAL_PICKUP");
  expect(stages).not.toContain("COMPLETED");
});
it("keeps closed stages accessible and honors explicit stage links", () => {
  expect(visibleFunnelStages("closed").map(([id]) => id)).toEqual(["COMPLETED", "ABANDONED"]);
  expect(visibleFunnelStages(null, "ABANDONED").map(([id]) => id)).toEqual(["ABANDONED"]);
});
it("never invents activity for contacts without a recorded message", () => {
  const now = Date.parse("2026-09-08T15:00:00Z");
  expect(lastContactLabel(null, now)).toBe("Sin fecha de último mensaje");
  expect(lastContactLabel("2026-09-06T15:00:00Z", now)).toBe("Sin mensajes hace 2 días");
});
