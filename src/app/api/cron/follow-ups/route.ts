import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { botpressRequest, hasIncomingAfter } from "@/lib/botpress";
import { AUTOMATED_FOLLOW_UP_TEXT, canSendAutomatedFollowUp, followUpScheduleOpen } from "@/lib/automated-follow-up";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const now = new Date();
  if (!followUpScheduleOpen(now)) return NextResponse.json({ processed: 0, reason: "Fuera del horario configurado" });
  const candidates = await prisma.conversation.findMany({
    where: { channel: "whatsapp", botpressId: { not: null }, lastIncomingAt: { not: null }, lastOutgoingAt: { not: null }, customer: { archivedAt: null, funnelStage: { notIn: ["COORDINATE_DELIVERY", "LOCAL_PICKUP", "COMPLETED", "ABANDONED"] } } },
    include: { customer: { select: { funnelStage: true } } }, orderBy: { lastOutgoingAt: "asc" }, take: 40,
  });
  let sent = 0, skipped = 0, uncertain = 0;
  for (const conversation of candidates) {
    if (!canSendAutomatedFollowUp({ now, lastIncomingAt: conversation.lastIncomingAt, lastOutgoingAt: conversation.lastOutgoingAt, stage: conversation.customer.funnelStage, channel: conversation.channel })) { skipped++; continue; }
    const eventId = `automatic-follow-up-${conversation.id}-${conversation.lastOutgoingAt!.getTime()}`;
    try {
      await prisma.conversationEvent.create({ data: { id: eventId, conversationId: conversation.id, direction: "OUTGOING", type: "AUTOMATED_FOLLOW_UP", payload: { state: "SENDING", text: AUTOMATED_FOLLOW_UP_TEXT, trigger: "12h_without_reply" } } });
    } catch { skipped++; continue; }
    try {
      if (await hasIncomingAfter(conversation.botpressId!, conversation.lastOutgoingAt!)) { await prisma.conversationEvent.update({ where: { id: eventId }, data: { payload: { state: "SKIPPED", reason: "customer_replied_after_last_outgoing" } } }); skipped++; continue; }
      const response = await botpressRequest<{ message: { id: string } }>("messages", { conversationId: conversation.botpressId, userId: process.env.BOTPRESS_BOT_ID, type: "text", payload: { text: AUTOMATED_FOLLOW_UP_TEXT }, tags: { source: "crm_automatic_follow_up" } });
      await prisma.$transaction([prisma.conversationEvent.update({ where: { id: eventId }, data: { payload: { state: "ACCEPTED", text: AUTOMATED_FOLLOW_UP_TEXT, messageId: response.message.id, trigger: "12h_without_reply" } } }), prisma.conversation.update({ where: { id: conversation.id }, data: { lastOutgoingAt: new Date(), updatedAt: new Date() } })]);
      sent++;
    } catch { await prisma.conversationEvent.update({ where: { id: eventId }, data: { payload: { state: "UNCERTAIN", reason: "delivery_not_confirmed" } } }).catch(() => {}); uncertain++; }
  }
  return NextResponse.json({ processed: candidates.length, sent, skipped, uncertain });
}
