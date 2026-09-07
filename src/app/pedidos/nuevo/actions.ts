"use server";

import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";
import { getPrice, LOCAL_ADDRESS } from "@/lib/sales-policy";
import { revalidatePath } from "next/cache";

const schema = z.object({
  conversationId: z.string().min(1).max(160), requestId: z.string().uuid(),
  productId: z.string().min(1), expectedPrice: z.coerce.number().int().nonnegative(), expectedShipping: z.coerce.number().int().nonnegative(),
  recipientName: z.string().trim().min(2).max(120), recipientPhone: z.string().trim().min(6).max(40),
  deliveryMethod: z.enum(["COURIER", "PICKUP"]), paymentMethod: z.enum(["CASH_OR_TRANSFER", "CARD_ONE_PAYMENT"]),
  deliveryAddress: z.string().trim().max(240), locality: z.string().trim().max(120), postalCode: z.string().trim().max(12),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), confirmed: z.literal("on"),
}).superRefine((data, ctx) => {
  if (data.deliveryMethod === "COURIER" && (data.deliveryAddress.length < 5 || data.locality.length < 2 || data.paymentMethod !== "CASH_OR_TRANSFER"))
    ctx.addIssue({ code: "custom", message: "Completá la dirección y localidad. Mensajería solo admite efectivo o transferencia." });
  const date = new Date(`${data.requestedDate}T12:00:00.000Z`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.requestedDate || data.requestedDate < today || date.getUTCDay() === 0)
    ctx.addIssue({ code: "custom", message: "Elegí una fecha válida, desde hoy y que no sea domingo." });
});

export type CreateOrderResult = { error?: string; orderId?: string; saleNumber?: number; totalCents?: number };
export async function createOrderFromChat(_: CreateOrderResult, form: FormData): Promise<CreateOrderResult> {
  const user = await requireCrmUser();
  if (user.role === "LOGISTICS") return { error: "La creación de ventas corresponde al equipo comercial." };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message === "Invalid literal value, expected \"on\"" ? "Confirmá que el cliente aceptó los datos y el importe final." : "Revisá los datos, la fecha y la confirmación del cliente. Mensajería no admite tarjeta." };
  const data = parsed.data;
  const fingerprint = createHash("sha256").update(JSON.stringify({ ...data, authorId: user.id })).digest("hex");
  const orderId = `manual-${data.requestId}`;
  try {
    const result = await prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<{ customerId: string; botPaused: boolean }[]>`SELECT "customerId", "botPaused" FROM crm."Conversation" WHERE id = ${data.conversationId} FOR UPDATE`;
      const conversation = rows[0];
      if (!conversation) throw new Error("No encontramos la conversación.");
      const previous = await tx.order.findUnique({ where: { id: orderId } });
      if (previous) {
        const event = await tx.conversationEvent.findUnique({ where: { id: orderId } });
        const payload = event?.payload as { fingerprint?: string } | undefined;
        if (event?.conversationId !== data.conversationId || payload?.fingerprint !== fingerprint) throw new Error("Esta solicitud ya fue utilizada con otros datos. Recargá el formulario.");
        return previous;
      }
      if (!conversation.botPaused) throw new Error("Pausá el bot en esta conversación antes de cargar el pedido manual.");
      const product = await tx.product.findUnique({ where: { id: data.productId } });
      if (!product?.isActive || product.currency !== "ARS") throw new Error("El producto ya no está disponible para esta venta.");
      if (product.priceCents !== data.expectedPrice || product.shippingCents !== data.expectedShipping) throw new Error("Cambió el precio o el envío. Recargá y confirmá el nuevo total con el cliente.");
      const terms = getPrice(data.deliveryMethod, data.paymentMethod, product);
      const attribution = await tx.acquisitionAttribution.findFirst({ where: { customerId: conversation.customerId }, orderBy: { capturedAt: "desc" } });
      const order = await tx.order.create({ data: {
        id: orderId, customerId: conversation.customerId, status: "PENDING_REVIEW",
        recipientName: data.recipientName, recipientPhone: data.recipientPhone,
        deliveryMethod: data.deliveryMethod, paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryMethod === "PICKUP" ? LOCAL_ADDRESS : data.deliveryAddress,
        locality: data.deliveryMethod === "PICKUP" ? "CABA" : data.locality,
        postalCode: data.deliveryMethod === "PICKUP" ? null : data.postalCode || null,
        requestedDate: new Date(`${data.requestedDate}T12:00:00.000Z`),
        shippingCents: terms.shippingCents, totalCents: terms.totalCents,
        riskReview: true, reviewReason: "Pedido manual: verificar datos, cobertura, fecha y horario antes de aprobar.",
        source: attribution?.source || "whatsapp", attributionId: attribution?.id,
        items: { create: { productId: product.id, quantity: 1, unitPriceCents: product.priceCents } },
        activities: { create: { action: "MANUAL_ORDER_CREATED", detail: `${user.displayName || user.email} registró la confirmación del cliente desde la conversación ${data.conversationId}. Pendiente de revisión. No se envió ningún mensaje automático.` } },
        tasks: { create: { customerId: conversation.customerId, type: "ORDER_REVIEW", title: "Revisar pedido creado desde el chat", description: "Validar datos, cobertura y fecha solicitada antes de pasarlo a logística." } },
      } });
      await tx.conversationEvent.create({ data: { id: orderId, conversationId: data.conversationId, direction: "INTERNAL", type: "ORDER_CREATED", payload: { fingerprint, orderId: order.id, detail: `Venta #${order.saleNumber} creada. Pendiente de revisión.`, author: user.displayName || user.email, authorId: user.id } } });
      return order;
    });
    revalidatePath("/pedidos"); revalidatePath("/bandeja"); revalidatePath("/tareas"); revalidatePath(`/clientes/${result.customerId}`);
    return { orderId: result.id, saleNumber: result.saleNumber, totalCents: result.totalCents };
  } catch (error) {
    // Only explicit business validation errors are safe to show; database errors may contain customer data.
    const message = error instanceof Error ? error.message : "";
    return { error: /^(No encontramos|Pausá el bot|El producto ya|Cambió el precio|Esta solicitud)/.test(message) ? message : "No pudimos confirmar el guardado. Reintentá sin recargar para evitar duplicados." };
  }
}
