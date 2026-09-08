export function shouldSubmitChat(event: { key: string; shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean; isComposing: boolean; keyCode?: number }) {
  return event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && !event.isComposing && event.keyCode !== 229;
}
