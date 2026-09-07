import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRODUCT, formatArs } from "@/lib/sales-policy";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), body)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const product = await prisma.product.findFirst({
    where: { sku: PRODUCT.sku, isActive: true, isAvailableForBot: true },
    select: { name: true, description: true, shortDescription: true, botDescription: true, technicalSpecs: true, priceCents: true, shippingCents: true, warrantyMonths: true, includedItems: true, imageUrls: true },
  });
  if (!product) return NextResponse.json({ available: false });
  return NextResponse.json({ available: true, product: {
    ...product,
    priceFormatted: formatArs(product.priceCents), shippingFormatted: formatArs(product.shippingCents),
    imageUrls: product.imageUrls.filter((value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } }),
    productUrl: "https://www.adaragroup.com.ar/productos/infinix-smart-10-negro-elegante-1rymw/",
  } });
}
