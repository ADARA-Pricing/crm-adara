"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function manageConversation(id: string, form: FormData) {
  const user = await requireCrmUser();
  const action = z.enum(["NOTE", "RESOLVE", "REOPEN"]).parse(form.get("action"));
  const note = z.string().trim().max(1000).parse(form.get("note") || "");
  if (action === "NOTE" && !note) return;
  const status = action === "RESOLVE" ? "CLOSED" : action === "REOPEN" ? "HUMAN_HANDOFF" : undefined;
  const detail = action === "RESOLVE" ? "Caso marcado como resuelto" : action === "REOPEN" ? "Caso reabierto para atención humana" : note;
  await prisma.conversation.update({ where: { id }, data: {
    status,
    events: { create: { direction: "INTERNAL", type: action, payload: { detail, author: user.displayName || user.email, authorId: user.id } } },
  } });
  revalidatePath("/bandeja");
}
