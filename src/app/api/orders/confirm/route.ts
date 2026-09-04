import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPrice, PRODUCT, type DeliveryMethod, type PaymentMethod } from "@/lib/sales-policy";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

export const runtime = "nodejs";

const confirmationSchema = z.object({
  deliveryMethod: z.enum(["FLEX", "PICKUP"]),
  paymentMethod: z.enum(["CASH_OR_TRANSFER", "CARD_ONE_PAYMENT"]),
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40).optional(),
  whatsappId: z.string().trim().min(1).max(120).optional(),
  deliveryAddress: z.string().trim().min(5).max(240),
  postalCode: z.string().trim().min(3).max(12).optional(),
  locality: z.string().trim().min(2).max(120),
  requestedDate: z.string().datetime().optional(),
  botpressConversationId: z.string().trim().min(1).max(160).optional()
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

  const parsed = confirmationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de pedido inválidos" }, { status: 400 });
  }

  const data = parsed.data;
  const terms = getPrice(data.deliveryMethod as DeliveryMethod, data.paymentMethod as PaymentMethod);
  const customer = data.phone
    ? await prisma.customer.upsert({
        where: { phone: data.phone },
        update: { fullName: data.recipientName, whatsappId: data.whatsappId },
        create: { phone: data.phone, fullName: data.recipientName, whatsappId: data.whatsappId }
      })
    : await prisma.customer.create({
        data: { fullName: data.recipientName, whatsappId: data.whatsappId }
      });

  const product = await prisma.product.findUnique({ where: { sku: PRODUCT.sku } });
  if (!product) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  }

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      status: "PENDING_REVIEW",
      deliveryMethod: data.deliveryMethod,
      paymentMethod: data.paymentMethod,
      recipientName: data.recipientName,
      deliveryAddress: data.deliveryAddress,
      postalCode: data.postalCode,
      locality: data.locality,
      requestedDate: data.requestedDate ? new Date(data.requestedDate) : undefined,
      shippingCents: terms.shippingCents,
      totalCents: terms.totalCents,
      riskReview: true,
      source: "whatsapp",
      items: { create: { productId: product.id, quantity: 1, unitPriceCents: terms.productCents } }
    }
  });

  if (data.botpressConversationId) {
    await prisma.conversation.upsert({
      where: { botpressId: data.botpressConversationId },
      update: { customerId: customer.id },
      create: { customerId: customer.id, botpressId: data.botpressConversationId }
    });
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    totalCents: order.totalCents,
    requiresManualReview: true
  }, { status: 201 });
}
