import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), cache: vi.fn(), create: vi.fn(), reads: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { conversationMessageCache: { findUnique: m.cache }, operatorMessageRead: { createMany: m.create, findMany: m.reads } } }));
import { POST } from "./route";
const request = (body: unknown, origin = "https://crm.test") => new Request("https://crm.test/api/inbox/reads", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "operator" }); m.reads.mockResolvedValue([]); m.cache.mockResolvedValue({ payload: { messages: [{ id: "in", direction: "incoming" }, { id: "out", direction: "outgoing" }] } }); });
it("rejects foreign origins before reading data", async () => { expect((await POST(request({}, "https://other.test"))).status).toBe(403); expect(m.auth).not.toHaveBeenCalled(); });
it("requires authentication", async () => { m.auth.mockRejectedValue(new Error("auth")); await expect(POST(request({ conversationId: "chat" }))).rejects.toThrow(); expect(m.cache).not.toHaveBeenCalled(); });
it("rejects oversized batches", async () => { expect((await POST(request({ conversationId: "chat", messageIds: Array(201).fill("in") }))).status).toBe(400); });
it("never marks outbound, invented or duplicate messages", async () => {
  await POST(request({ conversationId: "chat", messageIds: ["in", "out", "invented", "in"], userId: "someone-else" }));
  expect(m.create).toHaveBeenCalledWith({ data: [{ userId: "operator", conversationId: "chat", messageId: "in" }], skipDuplicates: true });
  expect(m.reads).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "operator" }) }));
});
it("reading badge state never marks messages read", async () => { await POST(request({ conversationId: "chat" })); expect(m.create).not.toHaveBeenCalled(); });
it("reports unknown instead of zero when cache is absent", async () => { m.cache.mockResolvedValue(null); const response = await POST(request({ conversationId: "chat" })); expect(await response.json()).toEqual({ available: false, readIds: [] }); });
it("returns a safe failure on database errors", async () => { m.cache.mockRejectedValue(new Error("secret")); const response = await POST(request({ conversationId: "chat" })); expect(response.status).toBe(503); expect(await response.text()).not.toContain("secret"); });
