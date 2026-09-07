"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";

const statusSchema = z.enum(["PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]);
const allowedTransitions: Record<string, string[]> = {
  PENDING_REVIEW: ["CANCELLED"],
  APPROVED_FOR_LOGISTICS: ["PREPARING"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"]
};

const labels: Record<string, string> = {
  APPROVED_FOR_LOGISTICS: "Aprobado para logística", PREPARING: "En preparación", SHIPPED: "En reparto", DELIVERED: "Entregado", CANCELLED: "Cancelado"
};

export async function updateOrderStatus(orderId: string, nextStatus: string) {
  const user = await requireCrmUser();
  const status = statusSchema.parse(nextStatus);
  if (status === "CANCELLED" && user.role === "LOGISTICS") throw new Error("La cancelación comercial requiere un vendedor o administrador.");
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, deliveryDate: true } });
  if (!order || !allowedTransitions[order.status]?.includes(status)) throw new Error("El pedido ya no permite ese cambio de estado.");
  const now = new Date();
  await prisma.$transaction(async tx => {
  const changed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: {
    status,
    deliveredAt: status === "DELIVERED" ? now : undefined,
    deliveryDate: status === "DELIVERED" && !order.deliveryDate ? now : undefined,
  } });
  if (!changed.count) throw new Error("El pedido cambió mientras lo estabas gestionando. Actualizá la página.");
  await tx.orderActivity.create({ data: { orderId, action: "STATUS_CHANGED", detail: `${user.displayName || user.email}: estado actualizado a ${labels[status]}.` } });
  });
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/"); revalidatePath("/pedidos"); revalidatePath("/logistica");
}

const logisticsSchema = z.object({
  assignedCourier: z.string().trim().max(100).optional(),
  deliveryTimeWindow: z.string().trim().max(100).optional(),
  logisticsNote: z.string().trim().max(500).optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export async function updateLogisticsDetails(orderId: string, formData: FormData) {
  await requireCrmUser();
  const data = logisticsSchema.parse({
    assignedCourier: formData.get("assignedCourier") || undefined,
    deliveryTimeWindow: formData.get("deliveryTimeWindow") || undefined,
    logisticsNote: formData.get("logisticsNote") || undefined,
    deliveryDate: formData.get("deliveryDate") || undefined
  });
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) throw new Error("No encontramos el pedido.");
  const { deliveryDate, ...logisticsData } = data;
  await prisma.order.update({ where: { id: orderId }, data: {
    ...logisticsData,
    deliveryDate: deliveryDate ? new Date(`${deliveryDate}T12:00:00.000Z`) : undefined,
    activities: { create: { action: "LOGISTICS_UPDATED", detail: deliveryDate ? `Se programó la entrega para el ${deliveryDate.split("-").reverse().join("/")}.` : "Se actualizaron los datos operativos de logística." } }
  } });
  revalidatePath("/logistica"); revalidatePath("/pedidos");
}
