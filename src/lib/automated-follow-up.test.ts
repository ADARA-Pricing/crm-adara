import { describe, expect, it } from "vitest";
import { canSendAutomatedFollowUp, followUpScheduleOpen } from "./automated-follow-up";

const mondayAtNoonAr = new Date("2026-09-14T15:00:00.000Z");
describe("automatic WhatsApp follow-up", () => {
  it("waits twelve hours after our last message while the reply window remains open", () => expect(canSendAutomatedFollowUp({ now: mondayAtNoonAr, lastIncomingAt: new Date("2026-09-14T00:00:00.000Z"), lastOutgoingAt: new Date("2026-09-14T03:00:00.000Z"), stage: "INTERESTED", channel: "whatsapp" })).toBe(true));
  it("does not send before twelve hours, after a reply, or in delivery coordination", () => {
    expect(canSendAutomatedFollowUp({ now: mondayAtNoonAr, lastIncomingAt: new Date("2026-09-14T00:00:00.000Z"), lastOutgoingAt: new Date("2026-09-14T04:00:00.000Z"), stage: "INTERESTED", channel: "whatsapp" })).toBe(false);
    expect(canSendAutomatedFollowUp({ now: mondayAtNoonAr, lastIncomingAt: new Date("2026-09-14T10:00:00.000Z"), lastOutgoingAt: new Date("2026-09-14T03:00:00.000Z"), stage: "INTERESTED", channel: "whatsapp" })).toBe(false);
    expect(canSendAutomatedFollowUp({ now: mondayAtNoonAr, lastIncomingAt: new Date("2026-09-14T00:00:00.000Z"), lastOutgoingAt: new Date("2026-09-14T03:00:00.000Z"), stage: "COORDINATE_DELIVERY", channel: "whatsapp" })).toBe(false);
  });
  it("only opens Monday through Friday from 8 to before 18 Argentina", () => {
    expect(followUpScheduleOpen(mondayAtNoonAr)).toBe(true);
    expect(followUpScheduleOpen(new Date("2026-09-14T10:00:00.000Z"))).toBe(false);
    expect(followUpScheduleOpen(new Date("2026-09-19T15:00:00.000Z"))).toBe(false);
  });
});
