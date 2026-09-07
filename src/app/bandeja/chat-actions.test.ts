import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), update: vi.fn(), event: vi.fn(), reserve: vi.fn(), transaction: vi.fn(), lock: vi.fn(), writeEvent: vi.fn(), request: vi.fn(), recent: vi.fn(), list: vi.fn(), events: vi.fn(), customer: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/botpress", () => ({ botpressRequest: mocks.request, hasRecentIncoming: mocks.recent, listMessages: mocks.list }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  conversation: { findUniqueOrThrow: mocks.find, update: mocks.update },
  conversationEvent: { findUnique: mocks.event, create: mocks.reserve, findMany: mocks.events },
  customer: { update: mocks.customer }, $transaction: mocks.transaction,
} }));
import { readConversation, sendConversationMessage, setConversationBotPaused } from "./chat-actions";

const input = { conversationId: "conversation", text: "Hola", requestId: "272b33cf-a477-4990-b992-dc0d50411996" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: "operator", email: "operator@example.test" });
  mocks.find.mockResolvedValue({ id: "conversation", botPaused: true, botpressId: "remote", customerId: "customer", customer: { whatsappProfileName: null } });
  mocks.event.mockResolvedValue(null); mocks.recent.mockResolvedValue(true);
  mocks.lock.mockResolvedValue([{ botPaused: true }]);
  mocks.request.mockResolvedValue({ message: { id: "sent-message" } });
  mocks.transaction.mockImplementation(fn => fn({ $queryRaw: mocks.lock, conversationEvent: { update: mocks.writeEvent }, conversation: { update: mocks.update } }));
});
it("requires authentication before every chat operation", async () => {
  mocks.auth.mockRejectedValue(new Error("unauthorized"));
  await expect(sendConversationMessage(input)).rejects.toThrow("unauthorized");
  await expect(readConversation("conversation")).rejects.toThrow("unauthorized");
  await expect(setConversationBotPaused("conversation", true)).rejects.toThrow("unauthorized");
  expect(mocks.request).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
});
it("persists pause independently with an operator audit", async () => {
  expect((await setConversationBotPaused("conversation", true)).ok).toBe(true);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ botPaused: true, status: "HUMAN_HANDOFF" }) }));
});
it("does not send while the bot is active", async () => {
  mocks.find.mockResolvedValue({ botPaused: false, botpressId: "remote" });
  expect((await sendConversationMessage(input)).ok).toBe(false);
  expect(mocks.request).not.toHaveBeenCalled();
});
it("does not send outside the client reply window", async () => {
  mocks.recent.mockResolvedValue(false);
  expect((await sendConversationMessage(input)).ok).toBe(false);
  expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.request).not.toHaveBeenCalled();
});
it("rechecks pause under lock and blocks a concurrent resume", async () => {
  mocks.lock.mockResolvedValue([{ botPaused: false }]);
  expect((await sendConversationMessage(input)).ok).toBe(false);
  expect(mocks.request).not.toHaveBeenCalled();
});
it("audits a manual send without reactivating the bot", async () => {
  expect((await sendConversationMessage(input)).ok).toBe(true);
  expect(mocks.request).toHaveBeenCalledWith("messages", expect.objectContaining({ conversationId: "remote", payload: { text: "Hola" } }));
  expect(mocks.writeEvent).toHaveBeenCalledWith(expect.objectContaining({ data: { payload: expect.objectContaining({ state: "ACCEPTED", messageId: "sent-message", authorId: "operator" }) } }));
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "conversation" }, data: { updatedAt: expect.any(Date) } });
});
it("does not repeat an accepted request", async () => {
  mocks.event.mockResolvedValue({ conversationId: "conversation", payload: { state: "ACCEPTED", text: "Hola", authorId: "operator" } });
  expect((await sendConversationMessage(input)).ok).toBe(true);
  expect(mocks.request).not.toHaveBeenCalled();
});
it("does not repeat an uncertain request", async () => {
  mocks.event.mockResolvedValue({ conversationId: "conversation", payload: { state: "SENDING", text: "Hola", authorId: "operator" } });
  expect((await sendConversationMessage(input)).ok).toBe(false);
  expect(mocks.request).not.toHaveBeenCalled();
});
it("does not claim success on a network timeout", async () => {
  mocks.request.mockRejectedValue(new Error("timeout"));
  expect(await sendConversationMessage(input)).toMatchObject({ ok: false, uncertain: true });
  expect(mocks.writeEvent).not.toHaveBeenCalled();
});
it("reads both message directions and backfills the WhatsApp tag without changing the confirmed name", async () => {
  mocks.list.mockResolvedValue({ messages: [{ id: "in", direction: "incoming", userId: "user" }, { id: "out", direction: "outgoing" }], meta: { nextToken: "older" } });
  mocks.events.mockResolvedValue([]);
  mocks.request.mockResolvedValue({ user: { tags: { "whatsapp:name": "Nombre de perfil" } } });
  const result = await readConversation("conversation");
  expect(result).toMatchObject({ ok: true, profileName: "Nombre de perfil", nextToken: "older" });
  expect(result.ok && result.messages.length).toBe(2);
  expect(mocks.customer).toHaveBeenCalledWith({ where: { id: "customer" }, data: { whatsappProfileName: "Nombre de perfil" } });
});
