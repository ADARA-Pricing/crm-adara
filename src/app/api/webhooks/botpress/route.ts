import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

const eventSchema = z.object({
  type: z.string(),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  payload: z.unknown().optional()
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  // Next step: persist customer, conversation and message records transactionally.
  // The route intentionally acknowledges events only after validation.
  return NextResponse.json({ accepted: true });
}
