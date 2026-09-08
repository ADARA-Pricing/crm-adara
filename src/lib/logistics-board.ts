import type { Prisma } from "@prisma/client";
export const logisticsViews = [["active", "Pendientes"], ["today", "Envíos de hoy"], ["next", "Próximos días"], ["transit", "En tránsito"], ["finished", "Finalizadas"]] as const;
export function logisticsViewWhere(view: string, today: Date): Prisma.OrderWhereInput {
  const tomorrow = new Date(today.getTime() + 86400000);
  const pending = { in: ["PENDING_REVIEW", "APPROVED_FOR_LOGISTICS", "PREPARING", "READY_FOR_PICKUP"] as const };
  if (view === "finished") return { status: "DELIVERED" };
  if (view === "transit") return { status: "SHIPPED" };
  if (view === "today") return { status: { in: [...pending.in] }, deliveryDate: { gte: today, lt: tomorrow } };
  if (view === "next") return { status: { in: [...pending.in] }, deliveryDate: { gte: tomorrow } };
  return { status: { in: [...pending.in] } };
}
