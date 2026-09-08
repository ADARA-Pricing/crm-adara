import { expect, it } from "vitest";
import { botCatalogAvailableWhere } from "./bot-catalog-product";

it("resolves the advertised product by immutable id, not editable SKU", () => {
  expect(botCatalogAvailableWhere).toEqual({ id: "infinix-smart-10-negro", isActive: true, isAvailableForBot: true });
  expect(botCatalogAvailableWhere).not.toHaveProperty("sku");
});
