import { strict as assert } from "node:assert";
import test from "node:test";
import { isClosingAcknowledgement } from "./closing-message";

test("recognizes only standalone closing acknowledgements", () => {
  assert.equal(isClosingAcknowledgement("Gracias 👋"), true);
  assert.equal(isClosingAcknowledgement("Te agradezco"), true);
  assert.equal(isClosingAcknowledgement("Gracias, pero ¿tiene NFC?"), false);
});
