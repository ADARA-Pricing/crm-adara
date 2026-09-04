"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";

const statusSchema = z.enum(["APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]);
const allowedTransitions: Record<string, string[]> = {
  PENDING_REVIEW: ["APPROVED_FOR_LOGISTICS", "CANCELLED"],
  APPROVED_FOR_LOGISTICS: ["PREPARING"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"]
};

const labels: Record<string, string> = {
  APPROVED_FOR_LOGISTICS: "Aprobado para logística", PREPARING: "En preparación", SHIPPED: "En reparto", DELIVERED: "Entregado", CANCELLED: "Cancelado"
};

export async function updateOrderStatus(orderId: string, nextStatus: string) {
  await requireCrmUser();
  const status = statusSchema.parse(nextStatus);
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order || !allowedTransitions[order.status]?.includes(status)) throw new Error("El pedido ya no permite ese cambio de estado.");
  const now = new Date();
  await prisma.order.update({ where: { id: orderId }, data: {
    status,
    reviewedAt: status === "APPROVED_FOR_LOGISTICS" ? now : undefined,
    deliveredAt: status === "DELIVERED" ? now : undefined,
    riskReview: status === "APPROVED_FOR_LOGISTICS" ? false : undefined,
    activities: { create: { action: "STATUS_CHANGED", detail: `Estado actualizado a ${labels[status]}.` } }
  } });
  revalidatePath("/"); revalidatePath("/pedidos"); revalidatePath("/logistica");
}

const logisticsSchema = z.object({
  assignedCourier: z.string().trim().max(100).optional(),
  deliveryTimeWindow: z.string().trim().max(100).optional(),
  logisticsNote: z.string().trim().max(500).optional()
});

export async function updateLogisticsDetails(orderId: string, formData: FormData) {
  await requireCrmUser();
  const data = logisticsSchema.parse({
    assignedCourier: formData.get("assignedCourier") || undefined,
    deliveryTimeWindow: formData.get("deliveryTimeWindow") || undefined,
    logisticsNote: formData.get("logisticsNote") || undefined
  });
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) throw new Error("No encontramos el pedido.");
  await prisma.order.update({ where: { id: orderId }, data: {
    ...data,
    activities: { create: { action: "LOGISTICS_UPDATED", detail: "Se actualizaron los datos operativos de logística." } }
  } });
  revalidatePath("/logistica"); revalidatePath("/pedidos");
}
