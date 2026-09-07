import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { customer: { updateMany: mocks.update } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { moveFunnelContact } from "./actions";

const input = { id: "contact-1", stage: "INTERESTED", updatedAt: "2026-09-07T12:00:00.000Z" };
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: "operator" }); });
it("persists the stage only if the contact version still matches", async () => {
  mocks.update.mockResolvedValue({ count: 1 });
  expect((await moveFunnelContact(input)).ok).toBe(true);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: input.id, funnelUpdatedAt: new Date(input.updatedAt) }, data: { funnelStage: "INTERESTED", funnelUpdatedAt: expect.any(Date) } });
  expect(mocks.revalidate).toHaveBeenCalledWith("/clientes/contact-1");
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
