import Link from "next/link";
import { funnelViewFilter } from "@/lib/crm-funnel-filters";
import type { ListQuery } from "@/lib/crm-list-filters";
import { funnelStages } from "@/lib/funnel-stages";
import { crmStatus } from "@/lib/crm-display";
import { CrmShell } from "@/components/crm-shell";
import { FunnelBoard } from "@/components/funnel-board";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crmDate } from "@/lib/crm-display";

export const dynamic = "force-dynamic";

export default async function FunnelPage({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const query = await searchParams;
  const user = await requireCrmUser();
  const filter = funnelViewFilter(query, user.id);
  const { category, owner } = filter;
  const members = await prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } });
  const categories = await prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } });
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where: filter.where, orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "asc" }], take: 100, include: { assignee: true, _count: { select: { orders: true } } } }),
    prisma.customer.count({ where: filter.where })
  ]);
  return <CrmShell active="/embudo"><header className="topbar"><div><p className="eyebrow">Seguimiento comercial</p><h1>Embudo de ventas</h1><p className="topbar-copy">Mové los contactos entre etapas para actualizar su seguimiento. Los pedidos y las entregas se gestionan por separado.</p></div></header>
    <form className="bot-date-form"><label>Buscar<input name="q" defaultValue={filter.q} placeholder="Nombre, teléfono o localidad" /></label><label>Categoría de interés <select name="category" defaultValue={category || ""}><option value="">Todas</option>{categories.map((item) => <option key={item.category} value={item.category!}>{item.category}</option>)}</select></label><label>Responsable <select name="owner" defaultValue={owner || ""}><option value="">Todos</option><option value="mine">Mis clientes</option><option value="none">Sin asignar</option>{members.map(m=><option key={m.id} value={m.id}>{m.displayName || m.email}</option>)}</select></label><label>Modalidad<select name="method" defaultValue={filter.method || ""}><option value="">Todas</option><option value="COURIER">Envío por mensajería</option><option value="PICKUP">Retiro en Av. Cramer</option><option value="unknown">A coordinar</option></select></label><label>Último mensaje registrado<select name="age" defaultValue={filter.age || ""}><option value="">Cualquier fecha</option><option value="7">Hace más de 7 días</option><option value="30">Hace más de 30 días</option><option value="unknown">Sin fecha registrada</option></select></label><label>Etapa visible<select name="viewStage" defaultValue={filter.stage || ""}><option value="">Todas las columnas</option>{funnelStages.map(([s]) => <option key={s} value={s}>{crmStatus(s)}</option>)}</select></label><button className="button secondary" type="submit">Filtrar</button><Link href="/embudo">Limpiar filtros</Link></form>
    <p className="muted">{total} contactos coinciden · Mostrando {customers.length}. {total > 100 ? "Se muestran los 100 más recientes; acotá los filtros para encontrar otros contactos." : ""} La antigüedad se basa en el último mensaje registrado, no en la última edición de la ficha. Para una vista compacta elegí una etapa visible.</p>
    <FunnelBoard visibleStage={filter.stage} category={category} customers={customers.map((customer) => ({
      id: customer.id, fullName: customer.fullName || customer.whatsappProfileName, assigneeName: customer.assignee?.displayName || customer.assignee?.email || null,
      interestCategories: customer.interestCategories, phone: customer.phone,
      locality: customer.locality, postalCode: customer.postalCode,
      deliveryPreference: customer.deliveryPreference, deliveryAddress: customer.deliveryAddress,
      lastMessagePreview: customer.lastMessagePreview, funnelNote: customer.funnelNote,
      funnelStage: customer.funnelStage, funnelUpdatedAt: customer.funnelUpdatedAt.toISOString(),
      dateLabel: crmDate(customer.lastMessageAt || customer.funnelUpdatedAt),
      orderCount: customer._count.orders,
    }))} />
  </CrmShell>;
}
