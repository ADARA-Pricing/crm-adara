import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ find: vi.fn(), categories: vi.fn(), auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { product: { findFirst: m.find, findMany: m.categories } } }));
vi.mock("@/lib/webhook-auth", () => ({ isValidBotpressWebhook: m.auth }));
import { POST } from "./route";
const request = () => new NextRequest("https://crm.test/api/catalog/product", { method: "POST", body: "{}" });
beforeEach(() => { vi.resetAllMocks(); m.auth.mockReturnValue(true); m.categories.mockResolvedValue([{ category: "Celulares" }]); });
it("finds the advertised product after a SKU edit", async () => {
  m.find.mockResolvedValue({ sku: "CE002N", name: "Smart 10", isActive: true, isAvailableForBot: true, priceCents: 19999900, shippingCents: 700000, imageUrls: [] });
  const result = await (await POST(request())).json();
  expect(result.available).toBe(true);
  expect(m.find.mock.calls[0][0].where).toEqual({ id: "infinix-smart-10-negro" });
});
it("distinguishes a missing record from a disabled product", async () => {
  m.find.mockResolvedValue(null);
  expect(await (await POST(request())).json()).toMatchObject({ available: false, reason: "catalog_missing" });
  m.find.mockResolvedValue({ isActive: false, isAvailableForBot: true });
  expect(await (await POST(request())).json()).toMatchObject({ available: false, reason: "not_offered" });
  m.find.mockResolvedValue({ isActive: true, isAvailableForBot: false });
  expect(await (await POST(request())).json()).toMatchObject({ available: false, reason: "not_offered" });
});
it("rejects unauthorized requests before reading the catalog", async () => {
  m.auth.mockReturnValue(false);
  expect((await POST(request())).status).toBe(401);
  expect(m.find).not.toHaveBeenCalled();
  expect(m.categories).not.toHaveBeenCalled();
});
