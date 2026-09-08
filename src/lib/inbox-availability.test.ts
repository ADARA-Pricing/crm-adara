import { expect, it } from "vitest";
import { inboxAvailability } from "./inbox-availability";
const now = Date.parse("2026-09-08T21:00:00Z");
const at = (hours: number) => ({ channel: "whatsapp", lastIncomingAt: new Date(now - hours * 3600000), lastOutgoingAt: null });
it("uses green above twelve hours remaining", () => expect(inboxAvailability(at(1), now).tone).toBe("available"));
it("uses amber at twelve hours remaining", () => expect(inboxAvailability(at(12), now).tone).toBe("warning"));
it("uses red at expiration", () => expect(inboxAvailability(at(24), now).tone).toBe("expired"));
it("never labels unknown or other channels expired", () => { expect(inboxAvailability({ ...at(1), lastIncomingAt: null }, now).tone).toBe("unknown"); expect(inboxAvailability({ ...at(1), channel: "webchat" }, now).tone).toBe("unknown"); });
