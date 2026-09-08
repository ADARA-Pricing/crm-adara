import { expect, it } from "vitest";
import { shouldSubmitChat } from "./chat-keyboard";
const enter = { key: "Enter", shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, isComposing: false };
it("submits plain Enter only", () => { expect(shouldSubmitChat(enter)).toBe(true); expect(shouldSubmitChat({...enter,key:"a"})).toBe(false); });
it("preserves Shift+Enter and composition without sending", () => {
  for (const modifier of ["shiftKey","ctrlKey","altKey","metaKey","isComposing"]) expect(shouldSubmitChat({...enter,[modifier]:true})).toBe(false);
  expect(shouldSubmitChat({...enter,keyCode:229})).toBe(false);
});
