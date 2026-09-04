import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkDeliveryCoverage } from "@/lib/coverage";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

const schema = z.object({ locality: z.string().trim().min(2).max(120), postalCode: z.string().trim().max(12).optional() });

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), rawBody)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos de zona inválidos" }, { status: 400 });
  const coverage = await checkDeliveryCoverage(parsed.data.locality, parsed.data.postalCode);
  return NextResponse.json({ ...coverage, requiresManualReview: !coverage.covered });
}
