import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), transaction: vi.fn(), read: vi.fn(), update: vi.fn(), event: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: m.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
import { changeChatStage } from "./stage-actions";
const input = { conversationId: "chat", stage: "INTERESTED", updatedAt: "2026-09-08T12:00:00.000Z" };
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({id:"operator",displayName:"Operador",email:"operator@example.test"});
  m.transaction.mockImplementation(fn => fn({conversation:{findUniqueOrThrow:m.read},customer:{updateMany:m.update},conversationEvent:{create:m.event}}));
  m.read.mockResolvedValue({ customerId:"customer", customer:{funnelStage:"FIRST_CONTACT",funnelUpdatedAt:new Date(input.updatedAt)} });
  m.update.mockResolvedValue({count:1});
});
it("records authenticated actor and both stages in the same transaction", async () => {
  expect((await changeChatStage(input)).ok).toBe(true);
  expect(m.event).toHaveBeenCalledWith({data:expect.objectContaining({conversationId:"chat",direction:"INTERNAL",payload:expect.objectContaining({authorId:"operator",author:"Operador",previousStage:"FIRST_CONTACT",newStage:"INTERESTED"})})});
  expect(m.update.mock.calls[0][0].where.id).toBe("customer");
  expect(m.revalidate).toHaveBeenCalledWith("/embudo");
});
it("rejects concurrent updates without recording a false event", async () => {
  m.update.mockResolvedValue({count:0});
  expect((await changeChatStage(input)).ok).toBe(false);
  expect(m.event).not.toHaveBeenCalled();
});
it("does not claim success when audit insertion fails", async () => {
  m.event.mockRejectedValue(new Error("audit unavailable"));
  expect((await changeChatStage(input)).ok).toBe(false);
  expect(m.revalidate).not.toHaveBeenCalled();
});
it("rejects invalid and unauthenticated requests", async () => {
  expect((await changeChatStage({...input,stage:"INVALID"})).ok).toBe(false);
  expect(m.transaction).not.toHaveBeenCalled();
  m.auth.mockRejectedValue(new Error("unauthorized"));
  await expect(changeChatStage(input)).rejects.toThrow("unauthorized");
});
it("rejects stale versions before updating", async () => {
  expect((await changeChatStage({...input,updatedAt:"2026-09-07T12:00:00.000Z"})).ok).toBe(false);
  expect(m.update).not.toHaveBeenCalled();
});
