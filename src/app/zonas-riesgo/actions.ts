"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const zoneSchema = z.object({ name: z.string().trim().min(3).max(100), latitude: z.coerce.number().gte(-55).lte(-20), longitude: z.coerce.number().gte(-75).lte(-50), radiusMeters: z.coerce.number().int().min(50).max(10_000), note: z.string().trim().max(500).optional() });

export async function createDangerZone(formData: FormData) {
  await requireAdmin();
  const data = zoneSchema.parse(Object.fromEntries(formData));
  await prisma.dangerZone.create({ data });
  revalidatePath("/zonas-riesgo");
}

export async function toggleDangerZone(id: string, active: boolean) {
  await requireAdmin();
  await prisma.dangerZone.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/zonas-riesgo");
}
