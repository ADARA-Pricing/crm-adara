import { beforeEach, expect, it, vi } from "vitest";
import { checkBotControl } from "../../botpress-agent/src/utils/control-policy";
const canBotReply = (id: string) => checkBotControl("https://crm.example.test", "test-only", id);
beforeEach(() => vi.restoreAllMocks());
it("allows replies only on an explicit unpaused response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ botPaused: false }) }));
  expect(await canBotReply("conversation")).toBe(true);
});
it.each([{ botPaused: true }, {}, { botPaused: "false" }])("blocks paused or malformed controls: %j", async control => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => control }));
  expect(await canBotReply("conversation")).toBe(false);
});
it("blocks replies if CRM is unavailable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  expect(await canBotReply("conversation")).toBe(false);
});
