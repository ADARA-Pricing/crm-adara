import type { Prisma } from "@prisma/client";
import { funnelStages } from "./funnel-stages";
export type ListQuery = Record<string, string | string[] | undefined>;
export function listReturn(path: "/clientes" | "/pedidos", raw: string | string[] | undefined) {
  if (typeof raw !== "string" || raw.length > 2000 || !raw.startsWith(`${path}?`)) return path;
  const params = new URLSearchParams(raw.slice(path.length + 1));
  return listUrl(path, Object.fromEntries(params), listPage(Object.fromEntries(params)));
}
export const orderFilterStates = ["DRAFT", "AWAITING_CUSTOMER_CONFIRMATION", "PENDING_REVIEW", "APPROVED_FOR_LOGISTICS", "PREPARING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const value = (raw: ListQuery, key: string) => typeof raw[key] === "string" ? raw[key].trim().slice(0, 120) : "";
export function listPage(raw: ListQuery) { const v = value(raw, "page"); return /^\d+$/.test(v) ? Math.min(10000, Math.max(1, Number(v))) : 1; }
export function listUrl(path: string, raw: ListQuery, page: number) {
  const query = new URLSearchParams();
  for (const key of ["q", "stage", "owner", "orders", "quality", "sort", "status", "method", "from", "to"]) if (value(raw, key)) query.set(key, value(raw, key));
  query.set("page", String(page)); return `${path}?${query}`;
}
export function customerListFilter(raw: ListQuery, userId: string) {
  const q = value(raw, "q"), owner = value(raw, "owner"), orders = value(raw, "orders"), quality = value(raw, "quality");
  const stage = funnelStages.find(([s]) => s === value(raw, "stage"))?.[0];
  const where: Prisma.CustomerWhereInput = { archivedAt: null,
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { whatsappProfileName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { locality: { contains: q, mode: "insensitive" } }] } : {}),
    ...(stage ? { funnelStage: stage } : {}),
    ...(owner ? { assigneeId: owner === "mine" ? userId : owner === "none" ? null : owner } : {}),
    ...(orders === "yes" ? { orders: { some: {} } } : orders === "no" ? { orders: { none: {} } } : {}),
    ...(quality === "phone" ? { phone: null } : quality === "name" ? { AND: [{ fullName: null }, { whatsappProfileName: null }] } : quality === "locality" ? { locality: null } : quality === "owner" ? { assigneeId: null } : quality === "conversation" ? { conversations: { none: {} } } : quality === "messages" ? { conversations: { some: { events: { none: {} } } } } : {}),
  };
  const sort = value(raw, "sort") === "name" ? "name" : "recent";
  const orderBy: Prisma.CustomerOrderByWithRelationInput[] = sort === "name" ? [{ fullName: { sort: "asc", nulls: "last" } }, { id: "asc" }] : [{ updatedAt: "desc" }, { id: "asc" }];
  return { q, owner, orders, quality, stage, sort, where, orderBy };
}
function day(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00-03:00`);
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() - 10800000).toISOString().slice(0, 10) !== value) return null;
  return date;
}
export function orderListFilter(raw: ListQuery) {
  const q = value(raw, "q"), from = value(raw, "from"), to = value(raw, "to");
  const status = orderFilterStates.find(s => s === value(raw, "status"));
  const method = ["PICKUP", "COURIER"].find(s => s === value(raw, "method"));
  const start = day(from), end = day(to);
  const error = (from && !start) || (to && !end) ? "Ingresá fechas válidas." : start && end && start > end ? "La fecha inicial no puede ser posterior a la final." : "";
  const number = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}), ...(method ? { deliveryMethod: method } : {}),
    ...(!error && (start || end) ? { saleDate: { ...(start ? { gte: start } : {}), ...(end ? { lt: new Date(end.getTime() + 86400000) } : {}) } } : {}),
    ...(q ? { OR: [{ recipientName: { contains: q, mode: "insensitive" } }, { recipientPhone: { contains: q } }, { customer: { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { whatsappProfileName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } }, ...(number !== null && number <= 2147483647 ? [{ saleNumber: number }] : [])] } : {}),
  };
  const requestedSort = value(raw, "sort");
  const sort = ["oldest", "total_high", "total_low", "client", "status"].includes(requestedSort) ? requestedSort : "recent";
  const orderBy: Prisma.OrderOrderByWithRelationInput[] = sort === "total_high" ? [{ totalCents: "desc" }, { id: "asc" }]
    : sort === "total_low" ? [{ totalCents: "asc" }, { id: "asc" }]
      : sort === "client" ? [{ recipientName: "asc" }, { id: "asc" }]
        : sort === "status" ? [{ status: "asc" }, { saleDate: "desc" }, { id: "asc" }]
          : [{ saleDate: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }];
  return { q, from, to, status, method, sort, where, orderBy, error };
}
