"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export async function assignLead(input: { id: string; assigneeId: string; expected: string | null }) {
  const user = await requireCrmUser();
  const parsed = z.object({ id: z.string().min(1).max(160), assigneeId: z.string().max(160), expected: z.string().nullable() }).safeParse(input);
  if(!parsed.success) return { ok: false, message: "Responsable inválido." };
  try {
    await prisma.$transaction(async tx => {
      const member = input.assigneeId ? await tx.userProfile.findFirst({ where: { id: input.assigneeId, isActive: true } }) : null;
      if(input.assigneeId && !member) throw new Error();
      const changed = await tx.customer.updateMany({ where: { id: input.id, assigneeId: input.expected }, data: { assigneeId: input.assigneeId || null } });
      if(!changed.count) throw new Error();
      const conversation = await tx.conversation.findFirst({ where: { customerId: input.id }, orderBy: { updatedAt: "desc" } });
      if(conversation) await tx.conversationEvent.create({ data: { conversationId: conversation.id, direction: "INTERNAL", type: "LEAD_ASSIGNED", payload: { author: user.displayName || user.email, authorId: user.id, previousAssigneeId: input.expected, assigneeId: input.assigneeId || null, detail: input.assigneeId ? `Responsable asignado: ${member?.displayName || member?.email || "Miembro del equipo"}` : "Responsable removido" } } });
    });
  } catch { return { ok: false, message: "No se pudo asignar. El responsable pudo cambiar o estar inactivo. Actualizá la ficha." }; }
  revalidatePath("/bandeja"); revalidatePath("/clientes"); revalidatePath("/embudo"); revalidatePath(`/clientes/${input.id}`);
  return { ok: true, message: "Responsable actualizado. No cambia el estado del bot ni envía mensajes." };
}
export async function updateLeadTask(input: { id: string; customerId: string; assigneeId: string; status: string; dueAt: string; expected: string }) {
  await requireCrmUser();
  const parsed = z.object({ id: z.string().min(1), customerId: z.string().min(1), assigneeId: z.string(), status: z.enum(["OPEN","IN_PROGRESS","DONE","CANCELLED"]), dueAt: z.string().datetime().or(z.literal("")), expected: z.string().datetime() }).safeParse(input);
  if(!parsed.success) return { ok: false, message: "Revisá los datos de la tarea." };
  try {
    await prisma.$transaction(async tx => {
      if(input.assigneeId && !await tx.userProfile.findFirst({ where: { id: input.assigneeId, isActive: true } })) throw new Error();
      const start=new Date(input.expected);
      const changed=await tx.task.updateMany({ where: { id: input.id, customerId: input.customerId, updatedAt: { gte: start, lt: new Date(start.getTime()+1) } }, data: { assigneeId: input.assigneeId || null, status: parsed.data.status, dueAt: input.dueAt ? new Date(input.dueAt) : null, completedAt: input.status === "DONE" ? new Date() : null } });
      if(!changed.count) throw new Error();
    });
  } catch { return { ok: false, message: "La tarea cambió o el responsable ya no está disponible. Actualizá antes de intentar nuevamente." }; }
  revalidatePath("/tareas"); revalidatePath("/");
  return { ok: true, message: "Tarea actualizada." };
}
