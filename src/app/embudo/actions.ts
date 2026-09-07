"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  id: z.string().min(1).max(160),
  stage: z.enum(["FIRST_CONTACT", "INTERESTED", "VERY_INTERESTED", "COORDINATE_DELIVERY", "LOCAL_PICKUP", "COMPLETED", "ABANDONED"]),
  updatedAt: z.string().datetime(),
});

export async function moveFunnelContact(input: unknown) {
  await requireCrmUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "La etapa indicada no es válida." };
  const { id, stage, updatedAt } = parsed.data;
  try {
    const now = new Date();
    const result = await prisma.customer.updateMany({
      // PostgreSQL may store microseconds; browser Date preserves milliseconds only.
      where: { id, funnelUpdatedAt: { gte: new Date(updatedAt), lt: new Date(new Date(updatedAt).getTime() + 1) } },
      data: { funnelStage: stage, funnelUpdatedAt: now },
    });
    if (!result.count) return { ok: false as const, message: "El contacto cambió mientras lo movías. Actualizamos el embudo; intentá nuevamente." };
    revalidatePath("/embudo");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/");
    return { ok: true as const, updatedAt: now.toISOString() };
  } catch {
    return { ok: false as const, message: "No se pudo guardar el cambio. La tarjeta sigue en su etapa anterior." };
  }
}
