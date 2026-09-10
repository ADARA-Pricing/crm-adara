import { z } from "zod";
import type { Prisma } from "@prisma/client";
export const inboxFilterSchema = z.object({
  q: z.string().trim().max(120).catch(""),
  stage: z.enum(["", "FIRST_CONTACT","INTERESTED","VERY_INTERESTED","COORDINATE_DELIVERY","LOCAL_PICKUP","COMPLETED","ABANDONED"]).catch(""),
  category: z.string().max(80).catch(""),
  owner: z.string().max(160).catch(""),
  window: z.enum(["","open","closing","closed","unknown"]).catch(""),
  attention: z.enum(["","pending","answered","human","bot"]).catch(""),
  bought: z.enum(["","yes","no"]).catch(""),
  filter: z.enum(["","all","human","closed","open"]).catch(""),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
  sort: z.enum(["recent","oldest"]).catch("recent"),
});
export function inboxWhere(raw: unknown, userId: string, now = new Date()) {
  const filters = inboxFilterSchema.parse(raw);
  const customer: Prisma.CustomerWhereInput = {};
  if (filters.q) customer.OR = ["fullName", "whatsappProfileName", "phone", "locality"].map(key => ({ [key]: { contains: filters.q, mode: "insensitive" } }));
  if(filters.stage) customer.funnelStage = filters.stage;
  if(filters.category) customer.interestCategories = { has: filters.category };
  if(filters.owner) customer.assigneeId = filters.owner === "mine" ? userId : filters.owner === "none" ? null : filters.owner;
  if(filters.bought) customer.orders = filters.bought === "yes" ? { some: { status: "DELIVERED" } } : { none: { status: "DELIVERED" } };
  // The operational inbox keeps archived conversations out by default. They remain
  // available through the explicit "Resueltos" filter and retain their full history.
  const where: Prisma.ConversationWhereInput = { customer, status: { not: "CLOSED" } };
  if(filters.filter === "human") where.status = "HUMAN_HANDOFF";
  if(filters.filter === "closed") where.status = "CLOSED";
  if(filters.filter === "open") where.status = { not: "CLOSED" };
  if(filters.attention === "human") where.OR = [{ status: "HUMAN_HANDOFF" }, { botPaused: true }];
  if(filters.attention === "bot") where.botPaused = false;
  const cutoff = new Date(now.getTime()-86400000);
  if(filters.window) where.channel = "whatsapp";
  if(filters.window === "open") where.lastIncomingAt = { gt: cutoff, lte: now };
  if(filters.window === "closing") where.lastIncomingAt = { gt: cutoff, lte: new Date(cutoff.getTime()+7200000) };
  if(filters.window === "closed") where.lastIncomingAt = { lte: cutoff };
  if(filters.window === "unknown") where.lastIncomingAt = null;
  return { filters, where };
}
