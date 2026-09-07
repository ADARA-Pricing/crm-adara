import { expect, it } from "vitest";
import { mergeInboxMessages, parseInboxSnapshot, type InboxMessage } from "./inbox-cache";
const message = (id: string, createdAt: string): InboxMessage => ({ id, createdAt, conversationId: "one", userId: "user", direction: "incoming", type: "text", payload: { text: id }, author: null });
it("merges updates by id without duplicating or losing earlier pages", () => {
  const old = message("old", "2026-09-06T10:00:00Z");
  const recent = message("recent", "2026-09-07T10:00:00Z");
  const updated = { ...recent, author: "Operator" };
  expect(mergeInboxMessages([old, recent], [updated])).toEqual([old, updated]);
});
it("distinguishes an empty cached chat from a missing cache", () => {
  expect(parseInboxSnapshot(null)).toBeUndefined();
  expect(parseInboxSnapshot({ messages: [] })).toEqual({ messages: [] });
});
