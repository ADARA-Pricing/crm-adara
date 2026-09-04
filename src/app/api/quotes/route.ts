import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  formatArs,
  getPickupSchedule,
  getPrice,
  isFlexLocation,
  type DeliveryMethod,
  type PaymentMethod
} from "@/lib/sales-policy";

const quoteSchema = z.object({
  deliveryMethod: z.enum(["FLEX", "PICKUP"]),
  paymentMethod: z.enum(["CASH_OR_TRANSFER", "CARD_ONE_PAYMENT"]),
  locality: z.string().trim().min(2).optional()
});

export async function POST(request: NextRequest) {
  const parsed = quoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de cotización inválidos" }, { status: 400 });
  }

  const { deliveryMethod, paymentMethod, locality } = parsed.data as {
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    locality?: string;
  };
  const price = getPrice(deliveryMethod, paymentMethod);
  const coverage = deliveryMethod === "PICKUP"
    ? "NOT_REQUIRED"
    : locality && isFlexLocation(locality) ? "PRELIMINARY_MATCH" : "REVIEW_REQUIRED";

  return NextResponse.json({
    ...price,
    productFormatted: formatArs(price.productCents),
    shippingFormatted: formatArs(price.shippingCents),
    totalFormatted: formatArs(price.totalCents),
    coverage,
    pickupSchedule: deliveryMethod === "PICKUP" ? getPickupSchedule() : undefined
  });
}
