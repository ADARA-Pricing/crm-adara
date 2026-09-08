import { describe, expect, it } from "vitest";
import { incomingMessage, whatsappPhoneFromConversation } from "../../botpress-agent/src/utils/incoming-message";

describe("wildcard Botpress messages", () => {
  it("reads text and user identity without guessing missing values", () => {
    expect(incomingMessage({ type: "text", userId: "user-test", payload: { text: "Hola" } }))
      .toEqual({ type: "text", userId: "user-test", text: "Hola" });
    expect(incomingMessage({ type: "image", payload: { imageUrl: "https://example.test/image" } })?.text).toBeUndefined();
  });
  it("rejects malformed events safely", () => {
    for (const value of [null, undefined, [], "hello", {}, { type: 123 }]) {
      expect(incomingMessage(value)).toBeUndefined();
    }
    expect(incomingMessage({ type: "text", userId: {}, payload: { text: {} } }))
      .toEqual({ type: "text", userId: undefined, text: undefined });
  });
  it("reads WhatsApp tags including SDK getters without inventing a phone", () => {
    const conversation = { get tags() { return { "whatsapp:userPhone": " 5491100000000 " }; } };
    expect(whatsappPhoneFromConversation(conversation)).toBe("5491100000000");
    for (const value of [null, {}, { tags: null }, { tags: { "whatsapp:userPhone": 123 } }]) {
      expect(whatsappPhoneFromConversation(value)).toBeUndefined();
    }
  });
});
