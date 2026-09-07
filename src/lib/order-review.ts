import { z } from "zod";

export const reviewSchema = z.object({
  orderId: z.string().min(1).max(160), version: z.string().datetime(),
  decision: z.enum(["APPROVE", "HOLD"]), note: z.string().trim().max(1000),
  recipient: z.string().optional(), payment: z.string().optional(), delivery: z.string().optional(), risk: z.string().optional(),
  deliveryDate: z.string(), timeWindow: z.string().trim().max(100),
}).superRefine((data, ctx) => {
  if (data.decision === "HOLD") {
    if (data.note.length < 5) ctx.addIssue({ code: "custom", message: "Indicá qué falta resolver para mantener el pedido en revisión." });
    return;
  }
  if ([data.recipient, data.payment, data.delivery, data.risk].some(value => value !== "on"))
    ctx.addIssue({ code: "custom", message: "Completá los cuatro controles antes de aprobar." });
  const date = new Date(`${data.deliveryDate}T12:00:00.000Z`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.deliveryDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== data.deliveryDate || data.deliveryDate < today || date.getUTCDay() === 0)
    ctx.addIssue({ code: "custom", message: "Elegí una fecha válida desde hoy. No hay entregas ni retiros los domingos." });
  if (data.timeWindow.length < 3) ctx.addIssue({ code: "custom", message: "Indicá la franja de entrega o retiro acordada." });
});
