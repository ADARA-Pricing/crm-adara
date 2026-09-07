import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmShell } from "@/components/crm-shell";
import { NewChatOrderForm } from "./order-form";

export const dynamic = "force-dynamic";
export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const user = await requireCrmUser();
  const { conversation: id } = await searchParams;
  if (!id) notFound();
  const conversation = await prisma.conversation.findUnique({ where: { id }, include: { customer: { include: { orders: { orderBy: { createdAt: "desc" }, take: 5 } } } } });
  if (!conversation) notFound();
  const products = await prisma.product.findMany({ where: { isActive: true, currency: "ARS" }, orderBy: { name: "asc" }, select: { id: true, name: true, priceCents: true, shippingCents: true } });
  const c = conversation.customer;
  return <CrmShell active="/pedidos"><header className="topbar"><div><p className="eyebrow">Venta manual desde el chat</p><h1>Crear pedido</h1><p>Cliente: {c.fullName || c.whatsappProfileName || c.phone || "Sin nombre confirmado"}</p></div></header>
    <NewChatOrderForm conversationId={id} requestId={randomUUID()} paused={conversation.botPaused} allowed={user.role !== "LOGISTICS"} products={products}
      customer={{ name: c.fullName || "", phone: c.phone || "", address: c.deliveryAddress || "", locality: c.locality || "", postalCode: c.postalCode || "", deliveryMethod: c.deliveryPreference === "PICKUP" ? "PICKUP" : "COURIER", requestedDate: c.requestedDate?.toISOString().slice(0,10) || "" }}
      orders={c.orders.map(o => ({ id: o.id, saleNumber: o.saleNumber, status: o.status }))} />
  </CrmShell>;
}
