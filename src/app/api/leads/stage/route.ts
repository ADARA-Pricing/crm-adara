import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

export const runtime = "nodejs";

const stageSchema = z.object({
  stage: z.enum(["FIRST_CONTACT", "INTERESTED", "VERY_INTERESTED", "COORDINATE_DELIVERY", "LOCAL_PICKUP", "COMPLETED", "ABANDONED"]).optional(),
  note: z.string().trim().max(240).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(6).max(40).optional(),
  deliveryPreference: z.enum(["COURIER", "PICKUP"]).optional(),
  locality: z.string().trim().min(2).max(120).optional(),
  deliveryAddress: z.string().trim().min(5).max(240).optional(),
  postalCode: z.string().trim().min(3).max(12).optional(),
  requestedDate: z.string().datetime().optional(),
  lastMessagePreview: z.string().trim().max(500).optional(),
  attribution: z.object({
    source: z.string().trim().max(80).optional(), referrer: z.string().trim().max(500).optional(),
    utmSource: z.string().trim().max(160).optional(), utmCampaign: z.string().trim().max(240).optional(), utmContent: z.string().trim().max(240).optional(),
    campaignId: z.string().trim().max(120).optional(), campaignName: z.string().trim().max(240).optional(),
    adsetId: z.string().trim().max(120).optional(), adsetName: z.string().trim().max(240).optional(),
    adId: z.string().trim().max(120).optional(), adName: z.string().trim().max(240).optional()
  }).optional(),
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
    funnelNote: data.note, funnelUpdatedAt: new Date(), fullName: data.fullName,
    deliveryPreference: data.deliveryPreference, locality: data.locality, deliveryAddress: data.deliveryAddress,
    postalCode: data.postalCode, requestedDate: data.requestedDate ? new Date(data.requestedDate) : undefined,
    lastMessagePreview: data.lastMessagePreview, lastMessageAt: data.lastMessagePreview ? new Date() : undefined
  };
  const customer = existing
    ? await prisma.customer.update({ where: { id: existing.id }, data: { ...values, funnelStage: data.stage || existing.funnelStage, fullName: data.fullName || existing.fullName, phone: data.phone || existing.phone, whatsappId: data.botpressConversationId, deliveryPreference: data.deliveryPreference || existing.deliveryPreference, locality: data.locality || existing.locality, deliveryAddress: data.deliveryAddress || existing.deliveryAddress, postalCode: data.postalCode || existing.postalCode, requestedDate: data.requestedDate ? new Date(data.requestedDate) : existing.requestedDate, lastMessagePreview: data.lastMessagePreview || existing.lastMessagePreview, lastMessageAt: data.lastMessagePreview ? new Date() : existing.lastMessageAt } })
    : await prisma.customer.create({ data: { ...values, funnelStage: data.stage || "FIRST_CONTACT", phone: data.phone, whatsappId: data.botpressConversationId } });
  await prisma.conversation.upsert({ where: { botpressId: data.botpressConversationId }, update: { customerId: customer.id }, create: { customerId: customer.id, botpressId: data.botpressConversationId } });
  if (data.attribution && Object.values(data.attribution).some(Boolean)) {
    await prisma.acquisitionAttribution.create({ data: { customerId: customer.id, ...data.attribution } });
  }
  return NextResponse.json({ customerId: customer.id, stage: customer.funnelStage });
}
