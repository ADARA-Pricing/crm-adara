import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), read: vi.fn(), transition: vi.fn(), transaction: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { moveFunnelContact } from "./actions";

const input = { id: "contact-1", stage: "INTERESTED", updatedAt: "2026-09-07T12:00:00.000Z" };
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: "operator" }); mocks.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({ customer: { findUnique: mocks.read, updateMany: mocks.update }, funnelTransition: { create: mocks.transition } })); mocks.read.mockResolvedValue({ funnelStage: "FIRST_CONTACT" }); });
it("persists the stage only if the contact version still matches", async () => {
  mocks.update.mockResolvedValue({ count: 1 });
  expect((await moveFunnelContact(input)).ok).toBe(true);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: input.id, funnelUpdatedAt: { gte: new Date(input.updatedAt), lt: new Date(new Date(input.updatedAt).getTime() + 1) } }, data: { funnelStage: "INTERESTED", funnelUpdatedAt: expect.any(Date) } });
  expect(mocks.revalidate).toHaveBeenCalledWith("/clientes/contact-1");
  expect(mocks.transition).toHaveBeenCalledWith({ data: expect.objectContaining({ customerId: input.id, fromStage: "FIRST_CONTACT", toStage: "INTERESTED" }) });
});
it("rejects stale contact changes", async () => {
  mocks.update.mockResolvedValue({ count: 0 });
  expect((await moveFunnelContact(input)).ok).toBe(false);
});
it("rejects an invalid stage without writing", async () => {
  expect((await moveFunnelContact({ ...input, stage: "INVALID" })).ok).toBe(false);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("requires authentication before writing", async () => {
  mocks.auth.mockRejectedValue(new Error("unauthorized"));
  await expect(moveFunnelContact(input)).rejects.toThrow("unauthorized");
  expect(mocks.update).not.toHaveBeenCalled();
});
it("reports database failure without claiming success", async () => {
  mocks.update.mockRejectedValue(new Error("offline"));
  expect((await moveFunnelContact(input)).ok).toBe(false);
});
