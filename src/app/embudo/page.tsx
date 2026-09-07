import { CrmShell } from "@/components/crm-shell";
import { FunnelBoard } from "@/components/funnel-board";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  await requireCrmUser();
  const customers = await prisma.customer.findMany({ orderBy: [{ lastMessageAt: "desc" }, { funnelUpdatedAt: "desc" }], take: 100, include: { _count: { select: { orders: true } } } });
  return <CrmShell active="/embudo"><header className="topbar"><div><p className="eyebrow">Seguimiento comercial</p><h1>Embudo de ventas</h1><p className="topbar-copy">Mové los contactos entre etapas para actualizar su seguimiento. Los pedidos y las entregas se gestionan por separado.</p></div></header>
    <FunnelBoard customers={customers.map((customer) => ({
      id: customer.id, fullName: customer.fullName, phone: customer.phone,
      locality: customer.locality, postalCode: customer.postalCode,
      deliveryPreference: customer.deliveryPreference, deliveryAddress: customer.deliveryAddress,
      lastMessagePreview: customer.lastMessagePreview, funnelNote: customer.funnelNote,
      funnelStage: customer.funnelStage, funnelUpdatedAt: customer.funnelUpdatedAt.toISOString(),
      dateLabel: (customer.lastMessageAt || customer.funnelUpdatedAt).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
      orderCount: customer._count.orders,
    }))} />
  </CrmShell>;
}
