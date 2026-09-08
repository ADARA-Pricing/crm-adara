import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readConversation } from "@/app/bandeja/chat-actions";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const input = z.object({id:z.string().min(1).max(160),cursor:z.string().max(4000).optional()}).safeParse({
    id:request.nextUrl.searchParams.get("id"),cursor:request.nextUrl.searchParams.get("cursor") ?? undefined,
  });
  if (!input.success) return NextResponse.json({ok:false,error:"Conversación inválida."},{status:400,headers:{"Cache-Control":"private, no-store"}});
  // readConversation authenticates the operator before touching any chat data.
  const result = await readConversation(input.data.id,input.data.cursor);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
}
