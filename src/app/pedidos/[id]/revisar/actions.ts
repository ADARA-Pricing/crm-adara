"use server";

import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/order-review";
import { revalidatePath } from "next/cache";
import { checkDeliveryCoverage } from "@/lib/coverage";

export type ReviewResult = { error?: string; saved?: boolean; approved?: boolean };
export async function reviewOrder(_: ReviewResult, form: FormData): Promise<ReviewResult> {
  const user = await requireCrmUser();
  if (user.role !== "ADMIN" && user.role !== "SALES") return { error: "La revisión comercial corresponde a Administración o Ventas." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revisá el formulario." };
  const data = parsed.data;
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM crm."Order" WHERE id = ${data.orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id: data.orderId }, include: { customer: true, items: true } });
      if (!order || order.status !== "PENDING_REVIEW") throw new Error("CONTROL:El pedido ya no está pendiente de revisión.");
      if (order.updatedAt.getTime() !== new Date(data.version).getTime()) throw new Error("CONTROL:Otro operador modificó el pedido. Recargá y revisá los datos actualizados.");
      const approved = data.decision === "APPROVE";
      if (approved) {
        if (order.recipientName.trim().length < 2 || (order.recipientPhone || order.customer.phone || "").trim().length < 6 || !order.items.length || order.totalCents <= 0)
          throw new Error("CONTROL:Faltan datos del receptor, teléfono, productos o importe. Mantené el pedido en revisión.");
        if (!["COURIER", "PICKUP"].includes(order.deliveryMethod) || !["CASH_OR_TRANSFER", "CARD_ONE_PAYMENT"].includes(order.paymentMethod) || (order.deliveryMethod === "COURIER" && (order.paymentMethod !== "CASH_OR_TRANSFER" || order.deliveryAddress.trim().length < 5 || order.locality.trim().length < 2)))
          throw new Error("CONTROL:La modalidad, el pago o el domicilio no cumplen las condiciones de venta.");
        if (order.deliveryMethod === "COURIER") {
          const coverage = await checkDeliveryCoverage(order.locality, order.postalCode);
          if (!coverage.covered && data.note.length < 10) throw new Error("CONTROL:La cobertura no está reconocida. Dejá constancia de la validación o excepción acordada con logística.");
        }
      }
      const now = new Date();
      await tx.order.update({ where: { id: order.id }, data: {
        status: approved ? "APPROVED_FOR_LOGISTICS" : "PENDING_REVIEW",
        riskReview: !approved, reviewReason: data.note || order.reviewReason,
        reviewedAt: approved ? now : undefined,
        deliveryDate: approved ? new Date(`${data.deliveryDate}T12:00:00.000Z`) : undefined,
        deliveryTimeWindow: approved ? data.timeWindow : undefined,
        activities: { create: { action: approved ? "COMMERCIAL_REVIEW_APPROVED" : "COMMERCIAL_REVIEW_HELD", detail: `${user.displayName || user.email} (${user.id}): ${approved ? `verificó receptor y teléfono, importe y pago, cobertura/fecha y seguridad. Aprobó para ${data.deliveryDate}, franja ${data.timeWindow}.` : "mantuvo el pedido en revisión."}${data.note ? ` Observación: ${data.note}` : ""}` } },
      } });
      if (approved) await tx.task.updateMany({ where: { orderId: order.id, type: "ORDER_REVIEW", status: { in: ["OPEN", "IN_PROGRESS"] } }, data: { status: "DONE", completedAt: now } });
    });
    for (const path of ["/", "/pedidos", `/pedidos/${data.orderId}`, `/pedidos/${data.orderId}/revisar`, "/logistica", "/tareas"]) revalidatePath(path);
    return { saved: true, approved: data.decision === "APPROVE" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { error: message.startsWith("CONTROL:") ? message.slice(8) : "No pudimos confirmar el guardado. Actualizá el pedido antes de reintentar." };
  }
}
