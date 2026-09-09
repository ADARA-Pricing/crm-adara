import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), tx: { $queryRaw: vi.fn(), customer: { findUnique: vi.fn(), update: vi.fn() }, task: { create: vi.fn() }, conversation: { count: vi.fn() }, userProfile: { findFirst: vi.fn() } } }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: (f: (tx: typeof m.tx) => unknown) => f(m.tx) } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { deleteCustomer, createLeadTask } from "./actions";
const input = { id: "customer", updatedAt: "2026-09-07T12:00:00.000Z", confirmation: "ELIMINAR" };
describe("Lead management", () => {
  beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ id: "admin", role: "ADMIN" }); m.tx.customer.findUnique.mockResolvedValue({ id: "customer", updatedAt: new Date(input.updatedAt) }); m.tx.conversation.count.mockResolvedValue(0); m.tx.userProfile.findFirst.mockResolvedValue({ id: "member" }); });
  it("requires administrator for archiving", async () => { m.auth.mockResolvedValue({ role: "SALES" }); expect((await deleteCustomer(input)).ok).toBe(false); expect(m.tx.customer.update).not.toHaveBeenCalled(); });
  it("requires typed confirmation", async () => { expect((await deleteCustomer({ ...input, confirmation: "" })).ok).toBe(false); expect(m.tx.customer.update).not.toHaveBeenCalled(); });
  it("rejects changed customer", async () => { m.tx.customer.findUnique.mockResolvedValue({ updatedAt: new Date() }); expect((await deleteCustomer(input)).ok).toBe(false); expect(m.tx.customer.update).not.toHaveBeenCalled(); });
  it("requires bot paused", async () => { m.tx.conversation.count.mockResolvedValue(1); expect((await deleteCustomer(input)).ok).toBe(false); expect(m.tx.customer.update).not.toHaveBeenCalled(); });
  it("archives the customer and preserves local relations", async () => { expect((await deleteCustomer(input)).ok).toBe(true); expect(m.tx.customer.update).toHaveBeenCalledWith({ where: { id: "customer" }, data: expect.objectContaining({ archivedById: "admin", archiveEvents: expect.any(Object) }) }); });
  it("assigns validated followup to active member", async () => { expect((await createLeadTask({ customerId: "customer", title: "Llamar mañana", description: "Consultar interés", assigneeId: "member", dueAt: "" })).ok).toBe(true); expect(m.tx.task.create).toHaveBeenCalledWith({ data: expect.objectContaining({ assigneeId: "member", customerId: "customer", type: "FOLLOW_UP" }) }); });
  it("rejects inactive member", async () => { m.tx.userProfile.findFirst.mockResolvedValue(null); expect((await createLeadTask({ customerId: "customer", title: "Llamar mañana", description: "", assigneeId: "member", dueAt: "" })).ok).toBe(false); expect(m.tx.task.create).not.toHaveBeenCalled(); });
  it("validates deadlines", async () => { expect((await createLeadTask({ customerId: "customer", title: "Llamar mañana", description: "", assigneeId: "member", dueAt: "invalid" })).ok).toBe(false); expect(m.tx.task.create).not.toHaveBeenCalled(); });
});
