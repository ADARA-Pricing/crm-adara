import "server-only";

export type BotpressMessage = {
  id: string; conversationId: string; userId: string; createdAt: string;
  direction: "incoming" | "outgoing"; type: string;
  payload: Record<string, unknown>;
};
export type MessagePage = { messages: BotpressMessage[]; meta: { nextToken?: string } };

export async function botpressRequest<T>(path: string, body?: unknown): Promise<T> {
  const token = process.env.BOTPRESS_API_TOKEN;
  const botId = process.env.BOTPRESS_BOT_ID;
  if (!token || !botId) throw new Error("Falta configurar la conexión con Botpress.");
  const response = await fetch(`https://api.botpress.cloud/v1/chat/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "x-bot-id": botId, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  // Never expose upstream bodies, tokens or customer payloads in errors.
  if (!response.ok) throw new Error(`Botpress no pudo completar la operación (${response.status}).`);
  return response.json();
}

export function listMessages(conversationId: string, nextToken?: string, afterDate?: string) {
  const query = new URLSearchParams({ conversationId });
  if (nextToken) query.set("nextToken", nextToken);
  if (afterDate) query.set("afterDate", afterDate);
  return botpressRequest<MessagePage>(`messages?${query}`);
}

export async function hasRecentIncoming(conversationId: string) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let nextToken: string | undefined;
  // Fail closed on unusually busy conversations; never infer a window from outgoing messages.
  for (let page = 0; page < 10; page++) {
    const result = await listMessages(conversationId, nextToken, new Date(cutoff).toISOString());
    if (result.messages.some(m => m.direction === "incoming" && Date.parse(m.createdAt) > cutoff)) return true;
    nextToken = result.meta?.nextToken;
    if (!nextToken) break;
  }
  return false;
}
