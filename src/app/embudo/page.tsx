import { CrmShell } from "@/components/crm-shell";
import { FunnelBoard } from "@/components/funnel-board";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  await requireCrmUser();
  const categories = await prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } });
  const customers = await prisma.customer.findMany({ where: category ? { interestCategories: { has: category } } : undefined, orderBy: [{ lastMessageAt: "desc" }, { funnelUpdatedAt: "desc" }], take: 100, include: { _count: { select: { orders: true } } } });
  return <CrmShell active="/embudo"><header className="topbar"><div><p className="eyebrow">Seguimiento comercial</p><h1>Embudo de ventas</h1><p className="topbar-copy">Mové los contactos entre etapas para actualizar su seguimiento. Los pedidos y las entregas se gestionan por separado.</p></div></header>
    <form className="topbar-actions" style={{ marginBottom: 16 }}><label>Categoría de interés <select name="category" defaultValue={category || ""}><option value="">Todas</option>{categories.map((item) => <option key={item.category} value={item.category!}>{item.category}</option>)}</select></label><button className="button secondary" type="submit">Filtrar</button></form>
    <FunnelBoard customers={customers.map((customer) => ({
      id: customer.id, fullName: customer.fullName || customer.whatsappProfileName,
      interestCategories: customer.interestCategories, phone: customer.phone,
      locality: customer.locality, postalCode: customer.postalCode,
      deliveryPreference: customer.deliveryPreference, deliveryAddress: customer.deliveryAddress,
      lastMessagePreview: customer.lastMessagePreview, funnelNote: customer.funnelNote,
      funnelStage: customer.funnelStage, funnelUpdatedAt: customer.funnelUpdatedAt.toISOString(),
      dateLabel: (customer.lastMessageAt || customer.funnelUpdatedAt).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
      orderCount: customer._count.orders,
    }))} />
  </CrmShell>;
}
