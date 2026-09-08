import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn(), allowed: vi.fn() }));
vi.mock("../../botpress-agent/node_modules/@botpress/runtime/dist/library.js", () => ({
  configuration: { crmApiBaseUrl: "https://crm.example.test" },
  secrets: { CRM_WEBHOOK_SECRET: "test-only" },
  Chat: class {
    constructor(_context: unknown) {}
    sendMessage(message: unknown) { return mocks.send(message); }
  },
}));
vi.mock("../../botpress-agent/src/utils/control-policy", () => ({ checkBotControl: mocks.allowed }));
import { ControlledChat } from "../../botpress-agent/src/utils/bot-control";

const chat = (id = "test-conversation") => new ControlledChat({ conversation: { id } } as ConstructorParameters<typeof ControlledChat>[0]);

describe("outgoing bot messages", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.allowed.mockResolvedValue(true); mocks.send.mockResolvedValue({ id: "test-message" }); });
  it("cleans text immediately before sending, preserving message tags", async () => {
    await chat().sendMessage({ type: "text", payload: { text: "Hola\n\n```text\n    Precio $199.999\n```" }, tags: { source: "test" } });
    expect(mocks.send).toHaveBeenCalledWith({ type: "text", payload: { text: "Hola\n\nPrecio $199.999" }, tags: { source: "test" } });
  });
  it("converts Markdown to plain text and leaves image payloads intact", async () => {
    const instance = chat();
    await instance.sendMessage({ type: "markdown", payload: { markdown: "**Hola**" } });
    expect(mocks.send).toHaveBeenLastCalledWith({ type: "text", payload: { text: "Hola" } });
    const image = { type: "image", payload: { imageUrl: "https://example.test/image.jpg" } };
    await instance.sendMessage(image);
    expect(mocks.send).toHaveBeenLastCalledWith(image);
  });
  it("rechecks pause for each message and refuses the next one when paused", async () => {
    const instance = chat();
    mocks.allowed.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await instance.sendMessage({ type: "text", payload: { text: "Hola" } });
    await expect(instance.sendMessage({ type: "text", payload: { text: "No debe salir" } })).rejects.toThrow("paused");
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("does not send without an identified conversation", async () => {
    await expect(chat("").sendMessage({ type: "text", payload: { text: "No debe salir" } })).rejects.toThrow("paused");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
