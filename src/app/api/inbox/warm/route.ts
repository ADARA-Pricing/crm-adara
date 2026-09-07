import { NextRequest, NextResponse } from "next/server";
import { warmInboxConversations } from "@/app/bandeja/chat-actions";
import { z } from "zod";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const parsed = z.array(z.string().min(1).max(160)).max(4).safeParse(request.nextUrl.searchParams.getAll("id"));
  if (!parsed.success) return NextResponse.json({ error: "Invalid batch" }, { status: 400 });
  const results = await warmInboxConversations(parsed.data);
  return NextResponse.json(results, { headers: { "Cache-Control": "private, no-store" } });
}
