import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("conversationId");
  if (!id || id.length > 160) return NextResponse.json({ error: "Invalid conversation" }, { status: 400 });
  const conversation = await prisma.conversation.findUnique({ where: { botpressId: id }, select: { botPaused: true } });
  return NextResponse.json({ botPaused: conversation?.botPaused ?? false }, { headers: { "Cache-Control": "no-store" } });
}
