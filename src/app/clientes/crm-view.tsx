import { customerListFilter, listPage, listUrl, type ListQuery } from "@/lib/crm-list-filters";
import { ListPagination } from "@/components/list-pagination";
import { funnelStages } from "@/lib/funnel-stages";
import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireCrmUser } from "@/lib/auth";
import { crmDate, crmPhone, crmStatus } from "@/lib/crm-display";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requireCrmUser();
  const query = await searchParams, filter = customerListFilter(query, user.id);
  const total = await prisma.customer.count({ where: filter.where });
  const page = Math.min(listPage(query), Math.max(1, Math.ceil(total / 50)));
  const [customers, members] = await Promise.all([
    prisma.customer.findMany({ take: 50, skip: (page - 1) * 50, where: filter.where, orderBy: filter.orderBy, include: { assignee: true, _count: { select: { orders: true } } } }),
    prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } })
  ]);
  return <CrmShell active="/clientes"><header className="topbar"><div><p className="eyebrow">Base de relaciones</p><h1>Clientes</h1><p className="topbar-copy">Una ficha por persona, incluso si todavía no compró.</p></div></header>
    <form className="bot-date-form" action="/clientes">
      <label>Buscar<input name="q" defaultValue={filter.q} placeholder="Nombre, teléfono o localidad" /></label>
      <label>Etapa<select name="stage" defaultValue={filter.stage || ""}><option value="">Todas</option>{funnelStages.map(([key]) => <option key={key} value={key}>{crmStatus(key)}</option>)}</select></label>
      <label>Responsable<select name="owner" defaultValue={filter.owner}><option value="">Todos</option><option value="mine">Mis clientes</option><option value="none">Sin asignar</option>{members.map(m => <option key={m.id} value={m.id}>{m.displayName || m.email}</option>)}</select></label>
      <label>Pedidos registrados<select name="orders" defaultValue={filter.orders}><option value="">Todos</option><option value="yes">Con pedidos</option><option value="no">Sin pedidos</option></select></label>
      <label>Calidad de datos<select name="quality" defaultValue={filter.quality}><option value="">Sin filtro</option><option value="phone">Teléfono pendiente</option><option value="name">Nombre pendiente</option><option value="locality">Sin localidad</option><option value="owner">Sin responsable</option><option value="conversation">Sin conversación</option><option value="messages">Sin mensajes sincronizados</option></select></label>
      <label>Orden<select name="sort" defaultValue={filter.sort}><option value="recent">Última actualización</option><option value="name">Nombre A–Z</option></select></label>
      <button className="button secondary">Filtrar</button><Link href="/clientes">Limpiar filtros</Link>
    </form>
    <p className="muted">Los filtros se combinan. Tener pedidos registrados no significa que hayan sido entregados.</p>
    <ListPagination path="/clientes" query={query} page={page} total={total} />

    <section className="table-wrap" tabIndex={0} aria-label="Listado de clientes"><table><thead><tr><th>Cliente</th><th>WhatsApp / teléfono</th><th>Etapa</th><th>Responsable</th><th>Pedidos</th><th>Estado</th><th>Última actualización</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td className="primary-cell"><Link className="table-primary-link" href={`/clientes/${customer.id}?returnTo=${encodeURIComponent(listUrl("/clientes", query, page))}`}>{customer.fullName || customer.whatsappProfileName || "Sin nombre"}</Link></td><td>{crmPhone(customer.phone) || <span className="muted">Teléfono por identificar</span>}</td><td>{crmStatus(customer.funnelStage)}</td><td>{customer.assignee?.displayName || customer.assignee?.email || "Sin asignar"}</td><td>{customer._count.orders}</td><td><span className="badge neutral">{crmStatus(customer.status)}</span></td><td className="muted">{crmDate(customer.updatedAt, true)}</td></tr>)}</tbody></table>{customers.length === 0 ? <div className="empty">No encontramos clientes con esa búsqueda. <Link href="/clientes">Limpiar filtros</Link></div> : null}</section>
  </CrmShell>;
}
