import { describe, expect, it } from "vitest";
import { labelEligibility, shippingLabel, zplText, type LabelOrder } from "./shipping-label";
const order: LabelOrder = { saleNumber: 123, status: "PREPARING", deliveryMethod: "COURIER", recipientName: "Cliente de prueba", recipientPhone: "1160000000", deliveryAddress: "Calle de prueba 123", locality: "Localidad", postalCode: "1234", deliveryDate: new Date("2026-09-10T03:00:00Z"), deliveryTimeWindow: null, assignedCourier: null, paymentMethod: "CASH_OR_TRANSFER", currency: "ARS", shippingCents: 700000, totalCents: 20699900, items: [{ quantity: 1, unitPriceCents: 19999900, product: { name: "Infinix Smart 10", sku: "INF10" } }] };
describe("shipping labels", () => {
  it("explains every required delivery field before enabling the label", () => {
    expect(labelEligibility({ ...order, recipientPhone: null, deliveryDate: null }).missing).toEqual(expect.arrayContaining(["teléfono", "fecha programada"]));
  });
  it("prints item identification, shipping and exact collection total", () => {
    const zpl = shippingLabel(order);
    expect(zpl).toContain(zplText("1 x Infinix Smart 10 | SKU: INF10 | c/u $ 199.999,00"));
    expect(zpl).toContain(zplText("Productos: $ 199.999,00"));
    expect(zpl).toContain(zplText("Envio: $ 7.000,00"));
    expect(zpl).toContain(zplText("TOTAL A COBRAR: $ 206.999,00"));
  });
  it("rejects mismatching totals", () => expect(() => shippingLabel({ ...order, totalCents: 1 })).toThrow());
  it("rejects other payment methods", () => expect(() => shippingLabel({ ...order, paymentMethod: "WEB" })).toThrow());
  it("rejects missing products", () => expect(() => shippingLabel({ ...order, items: [] })).toThrow());
  it("does not drop products when the label is full", () => expect(() => shippingLabel({ ...order, items: Array(10).fill(order.items[0]), totalCents: 200699000 })).toThrow());
  it("uses 100x150mm and one copy", () => { const zpl = shippingLabel(order); expect(zpl).toContain("^PW800\n^LL1200"); expect(zpl).toContain("^PQ1"); expect(zpl).toContain("^FD123^FS"); });
  it("encodes UTF8 and all printer control characters", () => { expect(zplText("^~_á")).toBe("_5e_7e_5f_c3_a1"); expect(shippingLabel({ ...order, recipientName: "^XZ^XA" }).match(/\^XA/g)).toHaveLength(1); });
  it.each(["DRAFT", "PENDING_REVIEW", "CANCELLED"])("rejects %s", status => expect(() => shippingLabel({ ...order, status })).toThrow());
  it("rejects pickup", () => expect(() => shippingLabel({ ...order, deliveryMethod: "PICKUP" })).toThrow());
  it("rejects incomplete destinations", () => expect(() => shippingLabel({ ...order, deliveryAddress: " " })).toThrow());
  it("never silently truncates addresses", () => expect(() => shippingLabel({ ...order, deliveryAddress: "calle ".repeat(100) })).toThrow());
  it("does not mutate the order", () => { const copy = structuredClone(order); shippingLabel(order); expect(order).toEqual(copy); });
});
