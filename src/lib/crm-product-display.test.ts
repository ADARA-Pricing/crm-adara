import { expect, it } from "vitest";
import { productMoneyInput, productViewFilters } from "./crm-product-display";

it("preserves a zero amount in the editor", () => {
  expect(productMoneyInput(0)).toBe("0");
  expect(productMoneyInput(undefined)).toBe("");
  expect(productMoneyInput(700000)).toBe("7000");
});
it("ignores duplicate and invalid filter parameters", () => {
  expect(productViewFilters({ q: ["one", "two"], active: ["yes", "no"], bot: ["yes", "no"] })).toEqual({ search: "", active: "", bot: "" });
  expect(productViewFilters({ active: "invalid" }).active).toBe("");
});
it("trims and bounds catalog searches", () => {
  expect(productViewFilters({ q: "  celular  ", active: "no", bot: "yes" })).toEqual({ search: "celular", active: "no", bot: "yes" });
  expect(productViewFilters({ q: "x".repeat(200) }).search).toHaveLength(120);
});
