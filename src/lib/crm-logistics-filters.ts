import type { Prisma } from "@prisma/client";
import { argentinaDayStart } from "./crm-display";
import type { ListQuery } from "./crm-list-filters";
export const logisticsStates = ["PENDING_REVIEW", "APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED", "READY_FOR_PICKUP"] as const;
export function logisticsFilter(raw: ListQuery, now = new Date()) {
  const get = (key: string) => typeof raw[key] === "string" ? raw[key].trim().slice(0, 120) : "";
  const q = get("q"), date = get("date");
  const status = logisticsStates.find(s => s === get("status"));
  const method = ["COURIER", "PICKUP"].find(s => s === get("method"));
  const timing = ["today", "overdue", "unscheduled"].find(s => s === get("timing"));
  const start = new Date(`${date}T00:00:00-03:00`);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(start.getTime()) && new Date(start.getTime() - 10800000).toISOString().slice(0,10) === date;
  const error = date && !valid ? "Ingresá una fecha programada válida." : "";
  const and: Prisma.OrderWhereInput[] = [];
  if (valid) and.push({ deliveryDate: { gte: start, lt: new Date(start.getTime() + 86400000) } });
  const today = argentinaDayStart(now);
  if (timing === "today") and.push({ deliveryDate: { gte: today, lt: new Date(today.getTime() + 86400000) } });
  if (timing === "overdue") and.push({ deliveryDate: { lt: today } });
  if (timing === "unscheduled") and.push({ deliveryDate: null });
  const where: Prisma.OrderWhereInput = { status: status || { in: [...logisticsStates] }, ...(method ? { deliveryMethod: method } : {}), ...(and.length ? { AND: and } : {}), ...(q ? { OR: [{ recipientName: { contains: q, mode: "insensitive" } }, { locality: { contains: q, mode: "insensitive" } }, { assignedCourier: { contains: q, mode: "insensitive" } }, { recipientPhone: { contains: q } }] } : {}) };
  return { q, date, status, method, timing, error, where, today };
}
