import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), tx: vi.fn(), lock: vi.fn(), find: vi.fn(), update: vi.fn(), tasks: vi.fn(), coverage: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: m.tx } }));
vi.mock("@/lib/coverage", () => ({ checkDeliveryCoverage: m.coverage }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { reviewOrder } from "./[id]/revisar/actions";
import { updateOrderStatus } from "./actions";
const version = "2026-09-07T12:00:00.000Z";
function form(values: Record<string, string> = {}) {
  const f = new FormData();
  Object.entries({ orderId: "order", version, decision: "APPROVE", note: "", recipient: "on", payment: "on", delivery: "on", risk: "on", deliveryDate: "2099-01-05", timeWindow: "18 a 21 h", ...values }).forEach(([key, value]) => f.set(key,value)); return f;
}
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "operator", role: "SALES", email: "sales@example.test" });
  m.find.mockResolvedValue({ id: "order", status: "PENDING_REVIEW", updatedAt: new Date(version), recipientName: "Cliente", recipientPhone: "1122334455", customer: {}, items: [{}], totalCents: 200000, deliveryMethod: "COURIER", paymentMethod: "CASH_OR_TRANSFER", deliveryAddress: "Calle 123", locality: "CABA" });
  m.coverage.mockResolvedValue({ covered: true });
  m.tx.mockImplementation(fn => fn({ $queryRaw: m.lock, order: { findUnique: m.find, update: m.update }, task: { updateMany: m.tasks } }));
});
it("approves with audit and completes review tasks atomically", async () => {
  expect(await reviewOrder({},form())).toEqual({ saved:true, approved:true });
  expect(m.update).toHaveBeenCalledWith({ where:{id:"order"},data:expect.objectContaining({status:"APPROVED_FOR_LOGISTICS",riskReview:false,reviewedAt:expect.any(Date),activities:expect.any(Object)}) });
  expect(m.tasks).toHaveBeenCalledOnce();
});
it("holds with a reason without completing tasks", async () => {
  expect(await reviewOrder({}, form({decision:"HOLD",note:"Falta verificar dirección",recipient:"",deliveryDate:"",timeWindow:""}))).toEqual({saved:true,approved:false});
  expect(m.tasks).not.toHaveBeenCalled();
});
it.each<Record<string, string>>([{recipient:""},{risk:""},{deliveryDate:"2020-01-01"},{deliveryDate:"2099-02-31"},{decision:"HOLD",note:""}])("rejects incomplete review %j", async values => {
  expect((await reviewOrder({},form(values))).error).toBeTruthy(); expect(m.tx).not.toHaveBeenCalled();
});
it("blocks stale reviews", async () => {
  expect((await reviewOrder({},form({version:"2026-09-06T12:00:00.000Z"}))).error).toContain("modificó"); expect(m.update).not.toHaveBeenCalled();
});
it("requires a documented exception when coverage is unknown", async () => {
  m.coverage.mockResolvedValue({covered:false});
  expect((await reviewOrder({},form())).error).toContain("cobertura"); expect(m.update).not.toHaveBeenCalled();
});
it("blocks logistics approval", async () => {
  m.auth.mockResolvedValue({role:"LOGISTICS"});
  expect((await reviewOrder({},form())).error).toBeTruthy(); expect(m.tx).not.toHaveBeenCalled();
});
it("requires authentication", async () => {
  m.auth.mockRejectedValue(new Error("unauthorized"));
  await expect(reviewOrder({},form())).rejects.toThrow("unauthorized");
});
it("does not allow bypassing review using the old approval action", async () => {
  await expect(updateOrderStatus("order","APPROVED_FOR_LOGISTICS")).rejects.toThrow(); expect(m.tx).not.toHaveBeenCalled();
});
