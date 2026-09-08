import { expect, it } from "vitest";
import { inboxPriorityPage } from "./inbox-priority";
it("fills a page with unanswered first", () => { expect(inboxPriorityPage(20,1)).toEqual({pendingSkip:0,pendingTake:20,restSkip:0,restTake:30}); });
it("spans multiple unanswered pages without skipping answered chats", () => { expect(inboxPriorityPage(70,2)).toEqual({pendingSkip:50,pendingTake:20,restSkip:0,restTake:30}); expect(inboxPriorityPage(70,3).restSkip).toBe(30); });
it("handles no pending chats", () => { expect(inboxPriorityPage(0,2)).toEqual({pendingSkip:50,pendingTake:0,restSkip:50,restTake:50}); });
