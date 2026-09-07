import type { Prisma } from "@prisma/client";
import { argentinaDayStart } from "./crm-display";
/** Read-only operator views; not used by task creation or bot automations. */
export function taskTimingFilter(timing: string | undefined, now = new Date()): Prisma.TaskWhereInput {
  const active: Prisma.TaskWhereInput = { status: { in: ["OPEN", "IN_PROGRESS"] } };
  if (timing === "overdue") return { ...active, dueAt: { lt: now } };
  if (timing === "upcoming") return { ...active, dueAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } };
  if (timing === "today") return { ...active, dueAt: { gte: argentinaDayStart(now), lt: new Date(argentinaDayStart(now).getTime() + 86400000) } };
  if (timing === "completed") return { status: "DONE" };
  return {};
}
