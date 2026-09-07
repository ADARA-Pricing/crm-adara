import "server-only";
import { prisma } from "./prisma";
import { messageActivity } from "./conversation-activity";
export async function syncConversationActivity(id: string, messages: { direction: string; createdAt: string }[]) {
  const { lastIncomingAt, lastOutgoingAt } = messageActivity(messages);
  // Monotonic dates: loading older pages or concurrent requests cannot reopen a stale window.
  await prisma.$executeRaw`UPDATE crm."Conversation" SET "lastIncomingAt" = GREATEST("lastIncomingAt", ${lastIncomingAt}::timestamp), "lastOutgoingAt" = GREATEST("lastOutgoingAt", ${lastOutgoingAt}::timestamp), "activitySyncedAt" = CURRENT_TIMESTAMP WHERE id = ${id}`;
}
