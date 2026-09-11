"use server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function updateTeamMember(input: unknown) {
  const admin = await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), displayName: z.string().trim().min(2).max(60), role: z.enum(["ADMIN", "SALES", "LOGISTICS"]), isActive: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisá nombre, rol y estado." };
  const data = parsed.data;
  if (data.id === admin.id && (!data.isActive || data.role !== "ADMIN")) return { ok: false, message: "No podés desactivar ni quitarte el rol de administrador desde tu propia sesión." };
  try { await prisma.userProfile.update({ where: { id: data.id }, data: { displayName: data.displayName, role: data.role, isActive: data.isActive } }); }
  catch { return { ok: false, message: "No se pudo actualizar el usuario. Verificá que siga disponible." }; }
  revalidatePath("/perfil"); revalidatePath("/perfil/equipo"); revalidatePath("/", "layout");
  return { ok: true, message: "Usuario actualizado." };
}
