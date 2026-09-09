import { describe, expect, it } from "vitest";
import { customerListFilter, orderListFilter, listPage, listUrl, listReturn } from "./crm-list-filters";
describe("read-only CRM list filters", () => {
  it("only permits a return to the original list", () => { expect(listReturn("/clientes", "https://evil.example")).toBe("/clientes"); expect(listReturn("/clientes", "/pedidos?q=x")).toBe("/clientes"); expect(listReturn("/clientes", "/clientes?q=Walter&page=2")).toBe("/clientes?q=Walter&page=2"); });
  it("bounds pagination and rejects repeated parameters", () => { expect(listPage({ page: "-1" })).toBe(1); expect(listPage({ page: "999999" })).toBe(10000); expect(listPage({ page: ["2", "3"] })).toBe(1); });
  it("combines customer filters and searches profile names", () => { const f = customerListFilter({ q: "Walter", stage: "INTERESTED", owner: "mine", orders: "no" }, "operator"); expect(f.where).toMatchObject({ funnelStage: "INTERESTED", assigneeId: "operator", orders: { none: {} } }); expect(f.where.OR).toContainEqual({ whatsappProfileName: { contains: "Walter", mode: "insensitive" } }); });
  it("supports unassigned and deterministic sorting", () => { const f = customerListFilter({ owner: "none", sort: "name", stage: "INVALID" }, "operator"); expect(f.where.assigneeId).toBeNull(); expect(f.where.funnelStage).toBeUndefined(); expect(f.orderBy.at(-1)).toEqual({ id: "asc" }); });
  it("filters records pending a specific quality check without including archived customers", () => {
    const phone = customerListFilter({ quality: "phone" }, "operator");
    const name = customerListFilter({ quality: "name" }, "operator");
    expect(phone.where).toMatchObject({ archivedAt: null, phone: null });
    expect(name.where).toMatchObject({ archivedAt: null, AND: [{ fullName: null }, { whatsappProfileName: null }] });
  });
  it("keeps pickup distinct without changing any states", () => { expect(orderListFilter({ method: "PICKUP", status: "READY_FOR_PICKUP" }).where).toMatchObject({ deliveryMethod: "PICKUP", status: "READY_FOR_PICKUP" }); });
  it("uses inclusive calendar dates in Argentina", () => { const f = orderListFilter({ from: "2026-09-07", to: "2026-09-07" }); expect(f.where.saleDate).toEqual({ gte: new Date("2026-09-07T03:00:00Z"), lt: new Date("2026-09-08T03:00:00Z") }); });
  it.each([{ from: "2026-02-30" }, { to: "bad" }, { from: "2026-09-08", to: "2026-09-07" }])("reports invalid dates %j", query => { expect(orderListFilter(query).error).toBeTruthy(); });
  it("searches sale numbers without overflowing database integers", () => { expect(orderListFilter({ q: "#42" }).where.OR).toContainEqual({ saleNumber: 42 }); expect(orderListFilter({ q: "999999999999999999" }).where.OR).not.toContainEqual({ saleNumber: 1e18 }); });
  it("preserves filters in page links but drops foreign keys", () => { const url = listUrl("/clientes", { q: "José & Ana", owner: "mine", quality: "phone", redirect: "https://evil.example" }, 2); expect(url).toContain("owner=mine"); expect(url).toContain("quality=phone"); expect(url).toContain("page=2"); expect(url).not.toContain("redirect"); });
});
