import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveArgentineAddress } from "@/lib/address-resolution";
import { requireCrmUser } from "@/lib/auth";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

const schema = z.object({ address: z.string().trim().min(5).max(240), locality: z.string().trim().min(2).max(120).optional() });

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), rawBody)) await requireCrmUser();
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dirección inválida" }, { status: 400 });
  return NextResponse.json(await resolveArgentineAddress(parsed.data.address, parsed.data.locality));
}
