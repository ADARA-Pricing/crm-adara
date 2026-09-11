import { expect, it } from "vitest";
import { inboxShortcuts } from "./inbox-shortcuts";

it("retains unrelated filters without carrying conversation, draft or pagination", () => {
  const items = inboxShortcuts({ category: "Celulares", q: "Walter", conversation: "private-id", draft: "draft-id", page: 3 });
  for (const item of items) {
    const query = new URL(item.href, "https://crm.test").searchParams;
    expect(query.get("q")).toBe("Walter");
    expect(query.get("category")).toBe("Celulares");
    expect(query.has("conversation")).toBe(false);
    expect(query.has("draft")).toBe(false);
    expect(query.has("page")).toBe(false);
    expect(item.selection.page).toBe(1);
  }
});
it("uses the same selection in the destination and its counter", () => {
  for (const item of inboxShortcuts({ attention: "answered", owner: "none" })) {
    const query = new URL(item.href, "https://crm.test").searchParams;
    for (const [key, value] of Object.entries(item.selection)) if (key !== "page" && value !== "") expect(query.get(key)).toBe(String(value));
  }
  expect(inboxShortcuts({})[0].selection.attention).toBe("pending");
});
it("does not accumulate shortcuts and clears the active shortcut", () => {
  const items = inboxShortcuts({ owner: "mine", window: "open", attention: "human" });
  const mine = items.find(item => item.label === "Mis chats")!;
  expect(mine.active).toBe(true);
  expect(mine.href).toBe("/bandeja");
  const interested = items.find(item => item.label === "Muy interesados")!;
  expect(interested.href).toContain("stage=VERY_INTERESTED");
  expect(interested.href).not.toContain("attention=human");
  expect(interested.href).not.toContain("owner=mine");
});
