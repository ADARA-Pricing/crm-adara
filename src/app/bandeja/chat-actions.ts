"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BotpressConnectionError, botpressRequest, hasRecentIncoming, listMessages } from "@/lib/botpress";
import { parseInboxSnapshot } from "@/lib/inbox-cache";
import { syncConversationActivity } from "@/lib/conversation-activity-server";

const idSchema = z.string().min(1).max(160);

export async function readConversation(id: string, cursor?: string) {
  await requireCrmUser();
  idSchema.parse(id);
  z.string().max(4000).optional().parse(cursor);
  try {
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id }, include: { customer: true } });
    if (!conversation.botpressId) throw new Error("Esta conversación no tiene un historial de Botpress vinculado.");
    const page = await listMessages(conversation.botpressId, cursor);
    await syncConversationActivity(id, page.messages).catch(() => {});
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
    const snapshot = { messages: page.messages.map(m => ({ ...m, author: authors.get(m.id) || null })), ...(page.meta?.nextToken ? { nextToken: page.meta.nextToken } : {}) };
    if (!cursor) {
      // This cache is a recent page, not the source of truth for bot control or sending.
      await prisma.conversationMessageCache.upsert({ where: { conversationId: id },
        create: { conversationId: id, payload: JSON.parse(JSON.stringify(snapshot)), syncedAt: new Date() },
        update: { payload: JSON.parse(JSON.stringify(snapshot)), syncedAt: new Date() },
      }).catch(() => { /* Cache failures must not hide live messages. */ });
    }
    return { ok: true as const, botPaused: conversation.botPaused, profileName, ...snapshot };
  } catch (error) {
    return { ok: false as const, error: error instanceof BotpressConnectionError ? error.message : "No se pudo cargar el historial. Probá actualizar en unos segundos." };
  }
}

export async function warmInboxConversations(ids: string[]) {
  await requireCrmUser();
  const parsed = z.array(idSchema).max(4).parse(ids);
  const conversations = await prisma.conversation.findMany({ where: { id: { in: parsed }, botpressId: { not: null } }, include: { messageCache: true, customer: { select: { whatsappProfileName: true } } } });
  const results = await Promise.all(conversations.map(async conversation => {
    const cached = parseInboxSnapshot(conversation.messageCache?.payload);
    if (cached && conversation.messageCache!.syncedAt.getTime() > Date.now() - 30000) {
      await syncConversationActivity(conversation.id, cached.messages).catch(() => {});
      return { id: conversation.id, ok: true as const, ...cached, profileName: conversation.customer.whatsappProfileName };
    }
    const result = await readConversation(conversation.id);
    return { id: conversation.id, ...result };
  }));
  return results;
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

export async function sendConversationMessage(input: { conversationId: string; text: string; requestId: string; draftId?: string }) {
  const user = await requireCrmUser();
  const parsed = z.object({ conversationId: idSchema, text: z.string().trim().min(1).max(4000), requestId: z.string().uuid(), draftId: idSchema.optional() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Escribí un mensaje de hasta 4000 caracteres." };
  const { conversationId, text, requestId, draftId } = parsed.data;
  // One durable attempt per draft, even if an operator clicks again with a new UUID.
  const eventId = draftId ? `human-draft-${draftId}` : `human-${requestId}`;
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
    if (draftId && !await prisma.automationRun.findFirst({ where: { id: draftId, customerId: conversation.customerId, status: "DRAFT" } })) return { ok: false as const, error: "El borrador no pertenece a este cliente o ya fue utilizado." };
    if (!(await hasRecentIncoming(conversation.botpressId))) return { ok: false as const, error: "No hay un mensaje del cliente en las últimas 24 horas. Esperá a que vuelva a escribir; el envío de plantillas todavía no está habilitado." };
    // Durable reservation: even a timeout or process crash must not send the same request twice.
    await prisma.conversationEvent.create({ data: { id: eventId, conversationId, direction: "OUTGOING", type: "HUMAN_MESSAGE", payload: { state: "SENDING", text, author, authorId: user.id } } });
    reserved = true;
    await prisma.$transaction(async tx => {
      // Serialize manual sends with pause/resume to avoid a concurrent operator resuming mid-send.
      const rows = await tx.$queryRaw<{ botPaused: boolean }[]>`SELECT "botPaused" FROM crm."Conversation" WHERE id = ${conversationId} FOR UPDATE`;
      if (!rows[0]?.botPaused) throw new Error("Bot resumed before send");
      if (draftId) {
        const claimed = await tx.automationRun.updateMany({ where: { id: draftId, customerId: conversation.customerId, status: "DRAFT" }, data: { status: "SENDING" } });
        if (!claimed.count) throw new Error("Draft already used");
      }
      const result = await botpressRequest<{ message: { id: string } }>("messages", {
        conversationId: conversation.botpressId, userId: process.env.BOTPRESS_BOT_ID,
        type: "text", payload: { text }, tags: {},
      });
      await tx.conversationEvent.update({ where: { id: eventId }, data: { payload: { state: "ACCEPTED", text, author, authorId: user.id, messageId: result.message.id } } });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date(), lastOutgoingAt: new Date() } });
      if (draftId) await tx.automationRun.update({ where: { id: draftId }, data: { status: "ACCEPTED" } });
    }, { maxWait: 5000, timeout: 20000 });
    revalidatePath("/bandeja");
    return { ok: true as const };
  } catch {
    if (reserved && draftId) await prisma.automationRun.updateMany({ where: { id: draftId, status: { in: ["DRAFT", "SENDING"] } }, data: { status: "UNCERTAIN" } }).catch(() => {});
    return { ok: false as const, uncertain: reserved, error: reserved
      ? "No pudimos confirmar el resultado. Revisá el historial antes de volver a enviar para evitar duplicados."
      : "No se pudo preparar el envío. Actualizá la conversación y volvé a intentar." };
  }
}
