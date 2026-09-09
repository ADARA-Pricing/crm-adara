"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";
import { orderActions, orderStatusLabel } from "@/lib/order-status";

const statusSchema = z.enum(["PREPARING", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED"]);

export async function updateOrderStatus(orderId: string, nextStatus: string, confirmed = false, reason = "") {
  const user = await requireCrmUser();
  const status = statusSchema.parse(nextStatus);
  if (status === "CANCELLED" && user.role === "LOGISTICS") throw new Error("La cancelación comercial requiere un vendedor o administrador.");
  if ((status === "DELIVERED" || status === "CANCELLED") && confirmed !== true) throw new Error("Confirmá la operación antes de guardar.");
  if (status === "CANCELLED" && reason.trim().length < 5) throw new Error("Indicá un motivo de al menos 5 caracteres para cancelar.");
  const original = await prisma.order.findUnique({ where: { id: orderId }, select: { customerId: true } });
  if (!original) throw new Error("No encontramos el pedido.");
  const now = new Date();
  await prisma.$transaction(async tx => {
    // Serialize closing different orders for the same customer.
    await tx.$queryRaw`SELECT id FROM crm."Customer" WHERE id = ${original.customerId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || !orderActions(order.status, order.deliveryMethod).some(action => action.status === status)) throw new Error("El pedido ya no permite ese cambio de estado.");
    const changed = await tx.order.updateMany({ where: { id: orderId, status: order.status, deliveryMethod: order.deliveryMethod }, data: {
      status, deliveredAt: status === "DELIVERED" ? now : undefined, reviewReason: status === "CANCELLED" ? reason.trim().slice(0, 500) : undefined,
    } });
    if (!changed.count) throw new Error("El pedido cambió mientras lo estabas gestionando. Actualizá la página.");
    let closure = "";
    if (status === "DELIVERED") {
      const pending = await tx.order.count({ where: { customerId: order.customerId, id: { not: orderId }, status: { notIn: ["DELIVERED", "CANCELLED"] } } });
      await tx.customer.update({ where: { id: order.customerId }, data: {
        status: "ACTIVE",
        ...(pending === 0 ? { funnelStage: "COMPLETED", funnelUpdatedAt: now, funnelNote: `Venta #${order.saleNumber} ${order.deliveryMethod === "PICKUP" ? "retirada en el local" : "entregada"}.` } : {}),
      } });
      await tx.task.updateMany({ where: { orderId, type: { in: ["ORDER_REVIEW", "LOGISTICS", "DELIVERY_CONFIRMATION"] }, status: { in: ["OPEN", "IN_PROGRESS"] } }, data: { status: "DONE", completedAt: now } });
      closure = ` El operador confirmó entrega/retiro y cobro. Cliente actualizado como activo. ${pending ? "Se conserva la etapa del embudo porque tiene otros pedidos pendientes." : "Embudo finalizado."}`;
    }
    await tx.orderActivity.create({ data: { orderId, action: "STATUS_CHANGED", detail: `${user.displayName || user.email} (${user.id}): estado actualizado a ${orderStatusLabel(status, order.deliveryMethod)}.${status === "CANCELLED" ? ` Motivo: ${reason.trim()}.` : ""}${closure}` } });
  });
  for (const path of ["/", "/pedidos", `/pedidos/${orderId}`, "/logistica", "/embudo", "/clientes", `/clientes/${original.customerId}`, "/tareas"]) revalidatePath(path);
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
