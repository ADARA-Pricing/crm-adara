"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskSchema = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().max(1000).optional(), type: z.enum(["FOLLOW_UP", "DELIVERY_CONFIRMATION", "ORDER_REVIEW", "LOGISTICS", "OTHER"]), dueAt: z.string().optional(), customerId: z.string().optional(), orderId: z.string().optional(), assigneeId: z.string().optional() });

export async function createTask(formData: FormData) {
  const currentUser = await requireCrmUser();
  const data = taskSchema.parse({ title: formData.get("title"), description: formData.get("description") || undefined, type: formData.get("type"), dueAt: formData.get("dueAt") || undefined, customerId: formData.get("customerId") || undefined, orderId: formData.get("orderId") || undefined, assigneeId: formData.get("assigneeId") || undefined });
  await prisma.task.create({ data: { ...data, dueAt: data.dueAt ? new Date(data.dueAt) : undefined, assigneeId: data.assigneeId || currentUser.id, customerId: data.customerId || undefined, orderId: data.orderId || undefined } });
  revalidatePath("/tareas"); revalidatePath("/");
}

export async function setTaskStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED") {
  await requireCrmUser();
  await prisma.task.update({ where: { id }, data: { status, completedAt: status === "DONE" ? new Date() : null } });
  revalidatePath("/tareas"); revalidatePath("/");
}
