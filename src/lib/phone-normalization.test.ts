import { expect, it } from "vitest";
import { normalizedPhoneKey } from "./phone-normalization";

it("matches common Argentina WhatsApp representations without rewriting originals", () => {
  expect(normalizedPhoneKey("+54 9 11 5555-1234")).toBe("ar:1155551234");
  expect(normalizedPhoneKey("11 5555 1234")).toBe("ar:1155551234");
});
it("keeps non-Argentina numbers in a separate comparison namespace", () => {
  expect(normalizedPhoneKey("+1 212 555 0199")).toBe("intl:12125550199");
  expect(normalizedPhoneKey("sin teléfono")).toBeNull();
});
