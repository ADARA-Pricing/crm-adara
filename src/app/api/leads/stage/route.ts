import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

export const runtime = "nodejs";

const stageSchema = z.object({
  stage: z.enum(["FIRST_CONTACT", "INTERESTED", "VERY_INTERESTED", "COORDINATE_DELIVERY", "LOCAL_PICKUP", "COMPLETED", "ABANDONED"]),
  note: z.string().trim().max(240).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(6).max(40).optional(),
  deliveryPreference: z.enum(["COURIER", "PICKUP"]).optional(),
  locality: z.string().trim().min(2).max(120).optional(),
  deliveryAddress: z.string().trim().min(5).max(240).optional(),
  postalCode: z.string().trim().min(3).max(12).optional(),
  requestedDate: z.string().datetime().optional(),
  botpressConversationId: z.string().trim().min(1).max(160)
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), rawBody)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = stageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos de embudo inválidos" }, { status: 400 });
  const data = parsed.data;
  const existing = await prisma.customer.findFirst({ where: { OR: [{ whatsappId: data.botpressConversationId }, ...(data.phone ? [{ phone: data.phone }] : [])] } });
  const values = {
    funnelStage: data.stage, funnelNote: data.note, funnelUpdatedAt: new Date(), fullName: data.fullName,
    deliveryPreference: data.deliveryPreference, locality: data.locality, deliveryAddress: data.deliveryAddress,
    postalCode: data.postalCode, requestedDate: data.requestedDate ? new Date(data.requestedDate) : undefined
  };
  const customer = existing
    ? await prisma.customer.update({ where: { id: existing.id }, data: { ...values, fullName: data.fullName || existing.fullName, phone: data.phone || existing.phone, whatsappId: data.botpressConversationId, deliveryPreference: data.deliveryPreference || existing.deliveryPreference, locality: data.locality || existing.locality, deliveryAddress: data.deliveryAddress || existing.deliveryAddress, postalCode: data.postalCode || existing.postalCode, requestedDate: data.requestedDate ? new Date(data.requestedDate) : existing.requestedDate } })
    : await prisma.customer.create({ data: { ...values, phone: data.phone, whatsappId: data.botpressConversationId } });
  await prisma.conversation.upsert({ where: { botpressId: data.botpressConversationId }, update: { customerId: customer.id }, create: { customerId: customer.id, botpressId: data.botpressConversationId } });
  return NextResponse.json({ customerId: customer.id, stage: customer.funnelStage });
}
