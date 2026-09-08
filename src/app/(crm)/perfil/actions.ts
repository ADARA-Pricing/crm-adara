"use server";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileInput } from "@/lib/operator-profile";
import { revalidatePath } from "next/cache";
export async function saveProfile(input: unknown) {
  const user = await requireCrmUser();
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisá el nombre y el color del avatar." };
  try {
    await prisma.userProfile.update({ where: { id: user.id }, data: parsed.data });
    revalidatePath("/", "layout");
    return { ok: true, message: "Perfil actualizado." };
  } catch { return { ok: false, message: "No pudimos guardar el perfil. Intentá nuevamente." }; }
}
