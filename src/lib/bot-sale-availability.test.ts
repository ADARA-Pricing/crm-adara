import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ product: vi.fn(), customer: vi.fn(), create: vi.fn(), auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  product: { findFirst: m.product }, customer: { findFirst: m.customer }, order: { create: m.create },
} }));
vi.mock("@/lib/webhook-auth", () => ({ isValidBotpressWebhook: m.auth }));
import { POST as quote } from "../app/api/quotes/route";
import { POST as confirm } from "../app/api/orders/confirm/route";
const data = { deliveryMethod: "PICKUP", paymentMethod: "CASH_OR_TRANSFER", recipientName: "Cliente de prueba", deliveryAddress: "Av. Cramer 2548", locality: "CABA" };
const request = (productId?: string) => new NextRequest("https://crm.test/api", { method: "POST", body: JSON.stringify({ ...data, productId }) });
beforeEach(() => { vi.resetAllMocks(); m.auth.mockReturnValue(true); });
describe.each([["quote", quote], ["confirm", confirm]] as const)("%s product safeguards", (_name, handler) => {
  it("rejects a different product ID without substituting the advertised item", async () => {
    expect((await handler(request("infinix-50-pro"))).status).toBe(409);
    expect(m.product).not.toHaveBeenCalled();
    expect(m.customer).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
  it("checks active and bot-enabled flags before proceeding and refuses unavailable products", async () => {
    m.product.mockResolvedValue(null);
    expect((await handler(request("infinix-smart-10-negro"))).status).toBe(409);
    expect(m.product).toHaveBeenCalledWith({ where: { id: "infinix-smart-10-negro", isActive: true, isAvailableForBot: true } });
    expect(m.customer).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
});
