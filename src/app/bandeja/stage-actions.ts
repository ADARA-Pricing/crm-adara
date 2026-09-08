"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crmStatus } from "@/lib/crm-display";

const schema = z.object({ conversationId: z.string().min(1).max(160),
  stage: z.enum(["FIRST_CONTACT", "INTERESTED", "VERY_INTERESTED", "COORDINATE_DELIVERY", "LOCAL_PICKUP", "COMPLETED", "ABANDONED"]),
  updatedAt: z.string().datetime() });

export async function changeChatStage(input: unknown) {
  const user = await requireCrmUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "La etapa indicada no es válida." };
  const { conversationId, stage, updatedAt } = parsed.data;
  try {
    const result = await prisma.$transaction(async tx => {
      const conversation = await tx.conversation.findUniqueOrThrow({ where: { id: conversationId }, include: { customer: true } });
      const previous = conversation.customer.funnelStage;
      const expected = new Date(updatedAt);
      if (conversation.customer.funnelUpdatedAt.getTime() !== expected.getTime()) throw new Error("conflict");
      if (previous === stage) return { customerId: conversation.customerId, updatedAt };
      const now = new Date();
      const changed = await tx.customer.updateMany({ where: { id: conversation.customerId, funnelStage: previous,
        funnelUpdatedAt: { gte: expected, lt: new Date(expected.getTime() + 1) } },
        data: { funnelStage: stage, funnelUpdatedAt: now } });
      if (!changed.count) throw new Error("conflict");
      await tx.conversationEvent.create({ data: { conversationId, direction: "INTERNAL", type: "MANUAL_FUNNEL_STAGE_CHANGED",
        payload: { authorId: user.id, author: user.displayName || user.email, previousStage: previous, newStage: stage,
          detail: `Etapa cambiada manualmente: ${crmStatus(previous)} → ${crmStatus(stage)}` } } });
      return { customerId: conversation.customerId, updatedAt: now.toISOString() };
    });
    for (const path of ["/bandeja", "/embudo", "/clientes", `/clientes/${result.customerId}`, "/"]) revalidatePath(path);
    return { ok: true as const, updatedAt: result.updatedAt, message: "Etapa guardada y cambio registrado." };
  } catch { return { ok: false as const, message: "No se pudo guardar. El contacto pudo cambiar; actualizá la ficha antes de volver a intentar." }; }
}
