import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

const schema = z.object({
  conversationId: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(6).max(40).optional(),
  reason: z.enum(["HUMAN_REQUEST", "COVERAGE_REVIEW", "SPECIAL_CASE", "OUT_OF_HOURS"]),
  summary: z.string().trim().min(3).max(500)
});

const labels: Record<string, string> = { HUMAN_REQUEST: "Solicitó hablar con una persona", COVERAGE_REVIEW: "Zona a revisar", SPECIAL_CASE: "Consulta especial", OUT_OF_HOURS: "Seguimiento fuera de horario" };

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), rawBody)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos de derivación inválidos" }, { status: 400 });
  const data = parsed.data;
  const existingConversation = await prisma.conversation.findUnique({ where: { botpressId: data.conversationId }, include: { customer: true } });
  const customer = existingConversation?.customer || await prisma.customer.upsert({ where: { whatsappId: data.conversationId }, update: { phone: data.phone }, create: { whatsappId: data.conversationId, phone: data.phone } });
  await prisma.conversation.upsert({ where: { botpressId: data.conversationId }, update: { customerId: customer.id, status: "HUMAN_HANDOFF", summary: data.summary }, create: { customerId: customer.id, botpressId: data.conversationId, status: "HUMAN_HANDOFF", summary: data.summary } });
  const detail = `${labels[data.reason]}. ${data.summary}`;
  const duplicate = await prisma.task.findFirst({ where: { customerId: customer.id, type: "FOLLOW_UP", status: { in: ["OPEN", "IN_PROGRESS"] }, description: detail } });
  const task = duplicate || await prisma.task.create({ data: { title: `Atender WhatsApp · ${labels[data.reason]}`, description: detail, type: "FOLLOW_UP", customerId: customer.id, dueAt: new Date() } });
  return NextResponse.json({ taskId: task.id, queued: true });
}
