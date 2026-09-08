import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  formatArs,
  getPickupSchedule,
  getPrice,
  isDeliveryLocation,
  type DeliveryMethod,
  type PaymentMethod
} from "@/lib/sales-policy";
import { prisma } from "@/lib/prisma";
import { BOT_CATALOG_PRODUCT_ID, botCatalogAvailableWhere } from "@/lib/bot-catalog-product";

const quoteSchema = z.object({
  productId: z.string().min(1).max(160).optional(),
  deliveryMethod: z.enum(["COURIER", "PICKUP"]),
  paymentMethod: z.enum(["CASH_OR_TRANSFER", "CARD_ONE_PAYMENT"]),
  locality: z.string().trim().min(2).optional()
}).superRefine((data, context) => {
  if (data.deliveryMethod === "COURIER" && data.paymentMethod === "CARD_ONE_PAYMENT") {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "La tarjeta no está disponible para envíos por mensajería" });
  }
});

export async function POST(request: NextRequest) {
  const parsed = quoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de cotización inválidos" }, { status: 400 });
  }
  if (parsed.data.productId && parsed.data.productId !== BOT_CATALOG_PRODUCT_ID) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  }

  const { deliveryMethod, paymentMethod, locality } = parsed.data as {
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    locality?: string;
  };
  const product = await prisma.product.findFirst({ where: botCatalogAvailableWhere });
  if (!product) return NextResponse.json({ error: "No hay producto disponible para cotizar" }, { status: 409 });
  const price = getPrice(deliveryMethod, paymentMethod, product);
  const coverage = deliveryMethod === "PICKUP"
    ? "NOT_REQUIRED"
    : locality && isDeliveryLocation(locality) ? "PRELIMINARY_MATCH" : "REVIEW_REQUIRED";

  return NextResponse.json({
    ...price,
    productFormatted: formatArs(price.productCents),
    shippingFormatted: formatArs(price.shippingCents),
    totalFormatted: formatArs(price.totalCents),
    coverage,
    pickupSchedule: deliveryMethod === "PICKUP" ? getPickupSchedule() : undefined
  });
}
