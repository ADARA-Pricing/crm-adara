"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskSchema = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().max(1000).optional(), type: z.enum(["FOLLOW_UP", "DELIVERY_CONFIRMATION", "ORDER_REVIEW", "LOGISTICS", "OTHER"]), dueAt: z.string().optional(), customerId: z.string().optional(), orderId: z.string().optional(), assigneeId: z.string().optional() });

export async function createTask(formData: FormData) {
  const currentUser = await requireCrmUser();
  const data = taskSchema.parse({ title: formData.get("title"), description: formData.get("description") || undefined, type: formData.get("type"), dueAt: formData.get("dueAt") || undefined, customerId: formData.get("customerId") || undefined, orderId: formData.get("orderId") || undefined, assigneeId: formData.get("assigneeId") || undefined });
  const dueAt = data.dueAt ? new Date(`${z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).parse(data.dueAt)}:00-03:00`) : undefined;
  if (dueAt && !Number.isFinite(dueAt.getTime())) throw new Error("Fecha inválida");
  const assigneeId = data.assigneeId || currentUser.id;
  if (!await prisma.userProfile.findFirst({ where: { id: assigneeId, isActive: true } })) throw new Error("Responsable no disponible");
  if(data.orderId && data.customerId && !await prisma.order.findFirst({where:{id:data.orderId,customerId:data.customerId}})) throw new Error("El pedido no pertenece al cliente seleccionado");
  await prisma.task.create({ data: { ...data, dueAt, assigneeId, customerId: data.customerId || undefined, orderId: data.orderId || undefined } });
  revalidatePath("/tareas"); revalidatePath("/");
}

export async function setTaskStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED") {
  await requireCrmUser();
  z.enum(["OPEN","IN_PROGRESS","DONE","CANCELLED"]).parse(status);
  await prisma.task.update({ where: { id }, data: { status, completedAt: status === "DONE" ? new Date() : null } });
  revalidatePath("/tareas"); revalidatePath("/");
}
