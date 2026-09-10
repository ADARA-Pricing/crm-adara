import { describe, expect, it } from "vitest";
import { productTechnicalSpecs } from "./product-technical-specs";

describe("productTechnicalSpecs", () => {
  it("turns the CRM object into safe, readable technical rows", () => {
    expect(productTechnicalSpecs({ ram: "8 GB (4+4)", storage: "128 GB", display: "120 Hz" })).toEqual([
      { label: "RAM", value: "8 GB (4+4)" }, { label: "Almacenamiento", value: "128 GB" }, { label: "Pantalla", value: "120 Hz" }
    ]);
  });
  it("does not expose unresolved template fragments as specifications", () => {
    expect(productTechnicalSpecs({ storage: "S&#123;storageText&#125;", nfc: "" })).toEqual([]);
  });
});
