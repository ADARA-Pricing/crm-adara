import { NextResponse } from "next/server";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseInboxSnapshot } from "@/lib/inbox-cache";
import { z } from "zod";
const input = z.object({ conversationId: z.string().min(1).max(160), messageIds: z.array(z.string().min(1).max(200)).max(200).optional() });
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origen inválido." }, { status: 403 });
  const user = await requireCrmUser();
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { conversationId, messageIds } = parsed.data;
  try {
    const cache = await prisma.conversationMessageCache.findUnique({ where: { conversationId } });
    const snapshot = parseInboxSnapshot(cache?.payload);
    if (!snapshot) return NextResponse.json({ available: false, readIds: [] });
    const incoming = snapshot.messages.filter(m => m.direction === "incoming");
    if (messageIds?.length) {
      const allowed = new Set(incoming.map(m => m.id));
      const valid = [...new Set(messageIds)].filter(id => allowed.has(id));
      if (valid.length) await prisma.operatorMessageRead.createMany({ data: valid.map(messageId => ({ userId: user.id, conversationId, messageId })), skipDuplicates: true });
    }
    const reads = await prisma.operatorMessageRead.findMany({ where: { userId: user.id, conversationId, messageId: { in: incoming.map(m => m.id) } }, select: { messageId: true } });
    return NextResponse.json({ available: true, readIds: reads.map(r => r.messageId) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No pudimos consultar la lectura." }, { status: 503 }); }
}
