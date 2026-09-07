import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), tx: vi.fn(), lock: vi.fn(), findOrder: vi.fn(), product: vi.fn(), create: vi.fn(), event: vi.fn(), eventFind: vi.fn(), attribution: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: m.tx } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createOrderFromChat } from "./actions";
function form(overrides: Record<string, string> = {}) {
  const f = new FormData();
  Object.entries({ conversationId: "chat", requestId: "272b33cf-a477-4990-b992-dc0d50411996", productId: "product", expectedPrice: "19999900", expectedShipping: "700000", recipientName: "Receptor", recipientPhone: "1122334455", deliveryMethod: "COURIER", paymentMethod: "CASH_OR_TRANSFER", deliveryAddress: "Calle 123", locality: "CABA", postalCode: "", requestedDate: "2099-01-05", confirmed: "on", ...overrides }).forEach(([k,v]) => f.set(k,v));
  return f;
}
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "operator", role: "SALES", email: "sales@example.test" });
  m.lock.mockResolvedValue([{ customerId: "customer", botPaused: true }]);
  m.product.mockResolvedValue({ id: "product", isActive: true, currency: "ARS", priceCents: 19999900, shippingCents: 700000 });
  m.create.mockImplementation(async ({ data }) => ({ ...data, saleNumber: 42 }));
  m.tx.mockImplementation(fn => fn({ $queryRaw: m.lock, order: { findUnique: m.findOrder, create: m.create }, product: { findUnique: m.product }, acquisitionAttribution: { findFirst: m.attribution }, conversationEvent: { create: m.event, findUnique: m.eventFind } }));
});
it("creates a confirmed manual order pending review with a recipient snapshot and review task", async () => {
  const result = await createOrderFromChat({}, form());
  expect(result.saleNumber).toBe(42);
  expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ customerId: "customer", recipientPhone: "1122334455", status: "PENDING_REVIEW", totalCents: 20699900, riskReview: true, tasks: expect.any(Object) }) });
});
it("requires an authenticated user", async () => {
  m.auth.mockRejectedValue(new Error("unauthorized"));
  await expect(createOrderFromChat({}, form())).rejects.toThrow("unauthorized");
  expect(m.tx).not.toHaveBeenCalled();
});
it("blocks logistics users", async () => {
  m.auth.mockResolvedValue({ role: "LOGISTICS" });
  expect((await createOrderFromChat({}, form())).error).toBeTruthy(); expect(m.tx).not.toHaveBeenCalled();
});
it.each<Record<string, string>>([{ confirmed: "" }, { paymentMethod: "CARD_ONE_PAYMENT" }, { requestedDate: "2020-01-01" }, { requestedDate: "2099-02-31" }])("rejects invalid conditions %j", async changes => {
  expect((await createOrderFromChat({}, form(changes))).error).toBeTruthy(); expect(m.create).not.toHaveBeenCalled();
});
it("blocks an active bot to prevent concurrent order taking", async () => {
  m.lock.mockResolvedValue([{ customerId: "customer", botPaused: false }]);
  expect((await createOrderFromChat({}, form())).error).toContain("Pausá"); expect(m.create).not.toHaveBeenCalled();
});
it("detects a changed catalog price", async () => {
  expect((await createOrderFromChat({}, form({ expectedPrice: "1" }))).error).toContain("Cambió"); expect(m.create).not.toHaveBeenCalled();
});
it("applies pickup card surcharge and no shipping", async () => {
  const result = await createOrderFromChat({}, form({ deliveryMethod: "PICKUP", paymentMethod: "CARD_ONE_PAYMENT" }));
  expect(result.totalCents).toBe(21399900);
  expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ deliveryAddress: "Av. Cramer 2548, CABA", shippingCents: 0 }) });
});
it("returns the existing order on an identical retry without creating twice", async () => {
  const first = await createOrderFromChat({}, form());
  const saved = m.create.mock.calls[0][0].data;
  const event = m.event.mock.calls[0][0].data;
  m.findOrder.mockResolvedValue({ ...saved, saleNumber: 42 }); m.eventFind.mockResolvedValue(event);
  const second = await createOrderFromChat({}, form());
  expect(second).toEqual(first); expect(m.create).toHaveBeenCalledTimes(1);
});
