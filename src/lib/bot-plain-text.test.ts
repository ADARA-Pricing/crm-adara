import { expect, it } from "vitest";
import { plainSalesText } from "../../botpress-agent/src/utils/plain-text";

it("removes code blocks and indentation that cause monospace paragraphs", () => {
  expect(plainSalesText("Hola\n\n```text\n    El precio es $199.999\n```" )).toBe("Hola\n\nEl precio es $199.999");
});
it("keeps links and numbers intact while removing emphasis", () => {
  expect(plainSalesText("**Smart 10**: $199.999\n[Producto](https://example.test/a_b?q=x*y)" )).toBe("Smart 10: $199.999\nProducto: https://example.test/a_b?q=x*y");
});
it("cleans spacing before punctuation without changing decimal prices", () => {
  expect(plainSalesText("Smart 10 negro . Precio : $199.999 . \n\nGarantía: 12 meses."))
    .toBe("Smart 10 negro. Precio: $199.999.\n\nGarantía: 12 meses.");
});
