"use server";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function deleteCustomer(input: { id: string; confirmation: string; updatedAt: string }) {
  const user = await requireCrmUser();
  if (user.role !== "ADMIN") return { ok: false, message: "Solo un administrador puede eliminar clientes." };
  const parsed = z.object({ id: z.string().min(1), confirmation: z.literal("ELIMINAR"), updatedAt: z.string().datetime() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Escribí ELIMINAR para confirmar." };
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM crm."Customer" WHERE id = ${input.id} FOR UPDATE`;
      const customer = await tx.customer.findUnique({ where: { id: input.id } });
      if (!customer || customer.updatedAt.toISOString() !== input.updatedAt) throw new Error("La ficha cambió. Actualizá la página antes de eliminarla.");
      await tx.$queryRaw`SELECT id FROM crm."Conversation" WHERE "customerId" = ${input.id} FOR UPDATE`;
      if (await tx.conversation.count({ where: { customerId: input.id, botPaused: false, botpressId: { not: null } } })) throw new Error("Pausá el bot en todas las conversaciones del cliente antes de eliminarlo.");
      await tx.customer.update({ where: { id: input.id }, data: { archivedAt: new Date(), archivedById: user.id, archiveEvents: { create: { actorId: user.id, action: "ARCHIVED" } } } });
    });
  } catch (error) {
    const safe = ["La ficha cambió.", "No se puede eliminar", "Primero resolvé", "Pausá el bot"];
    return { ok: false, message: error instanceof Error && safe.some(prefix => error.message.startsWith(prefix)) ? error.message : "No se pudo eliminar el cliente. Puede tener actividad nueva o vínculos que deben conservarse." };
  }
  for (const path of ["/clientes", "/embudo", "/bandeja", "/tareas", "/"]) revalidatePath(path);
  return { ok: true, message: "Cliente archivado. Se conserva todo su historial local." };
}

export async function createLeadTask(input: { customerId: string; title: string; description: string; assigneeId: string; dueAt: string }) {
  await requireCrmUser();
  const parsed = z.object({ customerId: z.string().min(1), title: z.string().trim().min(3).max(180), description: z.string().trim().max(1000), assigneeId: z.string().min(1), dueAt: z.string().datetime().or(z.literal("")) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisá título, responsable y fecha de la tarea." };
  try {
    await prisma.$transaction(async tx => {
      const assignee = await tx.userProfile.findFirst({ where: { id: input.assigneeId, isActive: true } });
      if (!assignee) throw new Error("assignee");
      await tx.task.create({ data: { customerId: input.customerId, title: parsed.data.title, description: parsed.data.description || null, assigneeId: input.assigneeId, dueAt: input.dueAt ? new Date(input.dueAt) : null, type: "FOLLOW_UP" } });
    });
  } catch { return { ok: false, message: "No se pudo asignar la tarea. Verificá que el cliente y el miembro sigan disponibles." }; }
  for (const path of ["/tareas", "/embudo", `/clientes/${input.customerId}`, "/"]) revalidatePath(path);
  return { ok: true, message: "Tarea creada y asignada." };
}
