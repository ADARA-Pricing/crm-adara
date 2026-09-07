"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { botpressRequest, hasRecentIncoming, listMessages } from "@/lib/botpress";

const idSchema = z.string().min(1).max(160);

export async function readConversation(id: string, cursor?: string) {
  await requireCrmUser();
  idSchema.parse(id);
  z.string().max(4000).optional().parse(cursor);
  try {
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id }, include: { customer: true } });
    if (!conversation.botpressId) throw new Error("Esta conversación no tiene un historial de Botpress vinculado.");
    const page = await listMessages(conversation.botpressId, cursor);
    const events = await prisma.conversationEvent.findMany({ where: { conversationId: id, direction: "OUTGOING", type: "HUMAN_MESSAGE" }, orderBy: { createdAt: "desc" }, take: 500 });
    const authors = new Map(events.map(e => {
      const p = e.payload as { messageId?: string; author?: string };
      return [p.messageId, p.author];
    }));
    let profileName = conversation.customer.whatsappProfileName;
    const incoming = page.messages.find(m => m.direction === "incoming");
    if (!profileName && incoming) {
      try {
        const { user } = await botpressRequest<{ user: { name?: string; tags?: Record<string, string> } }>(`users/${encodeURIComponent(incoming.userId)}`);
        profileName = (user.name || user.tags?.["whatsapp:name"] || user.tags?.["whatsapp:username"])?.trim().slice(0, 120) || null;
        if (profileName) {
          await prisma.customer.update({ where: { id: conversation.customerId }, data: { whatsappProfileName: profileName } });
          revalidatePath("/bandeja"); revalidatePath("/embudo"); revalidatePath("/clientes");
        }
      } catch { /* Optional profile must not hide the conversation. */ }
    }
    return { ok: true as const, botPaused: conversation.botPaused, profileName,
      messages: page.messages.map(m => ({ ...m, author: authors.get(m.id) || null })), nextToken: page.meta?.nextToken };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error && error.message.startsWith("Botpress") ? error.message : "No se pudo cargar el historial. Probá actualizar en unos segundos." };
  }
}

export async function setConversationBotPaused(id: string, paused: boolean) {
  const user = await requireCrmUser();
  idSchema.parse(id); z.boolean().parse(paused);
  try {
    await prisma.conversation.update({ where: { id }, data: {
      botPaused: paused,
      ...(paused ? { status: "HUMAN_HANDOFF" as const } : { status: "OPEN" as const }),
      events: { create: { direction: "INTERNAL", type: paused ? "BOT_PAUSED" : "BOT_RESUMED", payload: {
        author: user.displayName || user.email, authorId: user.id,
        detail: paused ? "Bot pausado: atención manual" : "Bot reactivado para próximos mensajes",
      } } },
    } });
    revalidatePath("/bandeja");
    return { ok: true as const };
  } catch { return { ok: false as const, error: "No se pudo cambiar el estado del bot. No se aplicó la acción." }; }
}

export async function sendConversationMessage(input: { conversationId: string; text: string; requestId: string }) {
  const user = await requireCrmUser();
  const parsed = z.object({ conversationId: idSchema, text: z.string().trim().min(1).max(4000), requestId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Escribí un mensaje de hasta 4000 caracteres." };
  const { conversationId, text, requestId } = parsed.data;
  const eventId = `human-${requestId}`;
  const author = user.displayName || user.email;
  let reserved = false;
  try {
    const previous = await prisma.conversationEvent.findUnique({ where: { id: eventId } });
    if (previous) {
      const p = previous.payload as { state?: string; text?: string; authorId?: string };
      if (previous.conversationId !== conversationId || p.text !== text || p.authorId !== user.id) throw new Error("request conflict");
      return p.state === "ACCEPTED" ? { ok: true as const } : { ok: false as const, uncertain: true, error: "El envío ya fue intentado. Actualizá el historial antes de intentar otro mensaje." };
    }
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    if (!conversation.botPaused) return { ok: false as const, error: "Pausá el bot antes de responder manualmente." };
    if (!conversation.botpressId) return { ok: false as const, error: "No hay una conversación de Botpress vinculada." };
    if (!(await hasRecentIncoming(conversation.botpressId))) return { ok: false as const, error: "No hay un mensaje del cliente en las últimas 24 horas. Esperá a que vuelva a escribir; el envío de plantillas todavía no está habilitado." };
    // Durable reservation: even a timeout or process crash must not send the same request twice.
    await prisma.conversationEvent.create({ data: { id: eventId, conversationId, direction: "OUTGOING", type: "HUMAN_MESSAGE", payload: { state: "SENDING", text, author, authorId: user.id } } });
    reserved = true;
    await prisma.$transaction(async tx => {
      // Serialize manual sends with pause/resume to avoid a concurrent operator resuming mid-send.
      const rows = await tx.$queryRaw<{ botPaused: boolean }[]>`SELECT "botPaused" FROM crm."Conversation" WHERE id = ${conversationId} FOR UPDATE`;
      if (!rows[0]?.botPaused) throw new Error("Bot resumed before send");
      const result = await botpressRequest<{ message: { id: string } }>("messages", {
        conversationId: conversation.botpressId, userId: process.env.BOTPRESS_BOT_ID,
        type: "text", payload: { text }, tags: {},
      });
      await tx.conversationEvent.update({ where: { id: eventId }, data: { payload: { state: "ACCEPTED", text, author, authorId: user.id, messageId: result.message.id } } });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    }, { maxWait: 5000, timeout: 20000 });
    revalidatePath("/bandeja");
    return { ok: true as const };
  } catch {
    return { ok: false as const, uncertain: reserved, error: reserved
      ? "No pudimos confirmar el resultado. Revisá el historial antes de volver a enviar para evitar duplicados."
      : "No se pudo preparar el envío. Actualizá la conversación y volvé a intentar." };
  }
}
