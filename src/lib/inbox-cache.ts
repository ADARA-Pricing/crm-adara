import type { BotpressMessage } from "./botpress";

export type InboxMessage = BotpressMessage & { author: string | null };
export type InboxSnapshot = { messages: InboxMessage[]; nextToken?: string };

export function parseInboxSnapshot(value: unknown): InboxSnapshot | undefined {
  if (!value || typeof value !== "object" || !("messages" in value) || !Array.isArray(value.messages)) return undefined;
  return value as InboxSnapshot;
}

export function mergeInboxMessages(previous: InboxMessage[], incoming: InboxMessage[]) {
  const merged = new Map(previous.map(message => [message.id, message]));
  incoming.forEach(message => merged.set(message.id, message));
  return [...merged.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}
