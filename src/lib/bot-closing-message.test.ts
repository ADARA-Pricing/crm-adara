import { describe, expect, it } from "vitest";
import { isClosingAcknowledgement } from "../../botpress-agent/src/utils/closing-message";

describe("bot closing acknowledgements", () => {
  it("recognizes standalone thanks without silencing a new question", () => {
    expect(isClosingAcknowledgement("Gracias 👋")).toBe(true);
    expect(isClosingAcknowledgement("Te agradezco")).toBe(true);
    expect(isClosingAcknowledgement("Gracias, pero ¿tiene NFC?")).toBe(false);
  });
});
