import { orderListFilter, orderFilterStates, listPage, listUrl, type ListQuery } from "@/lib/crm-list-filters";
import { ListPagination } from "@/components/list-pagination";
import { requireCrmUser } from "@/lib/auth";
import { crmStatus } from "@/lib/crm-display";
import { crmDate } from "@/lib/crm-display";
import { orderStatusLabel } from "@/lib/order-status";
import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs } from "@/lib/sales-policy";
import { OrderStatusActions } from "@/components/order-status-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<ListQuery> }) {
  await requireCrmUser();
  const query = await searchParams, filter = orderListFilter(query);
  const total = filter.error ? 0 : await prisma.order.count({ where: filter.where });
  const page = Math.min(listPage(query), Math.max(1, Math.ceil(total / 50)));
  const [orders, amount] = filter.error ? [[], null] : await Promise.all([
    prisma.order.findMany({ take: 50, skip: (page - 1) * 50, where: filter.where, orderBy: filter.orderBy, include: { customer: true, items: { include: { product: true } } } }),
    prisma.order.aggregate({ where: filter.where, _sum: { totalCents: true } })
  ]);
  return <CrmShell active="/pedidos"><header className="topbar"><div><p className="eyebrow">Ventas</p><h1>Pedidos</h1><p className="topbar-copy">Cada confirmación entra a revisión antes de pasar a logística.</p></div></header>
    <form className="bot-date-form">
      <label>Buscar<input name="q" defaultValue={filter.q} placeholder="Venta, cliente o teléfono" /></label>
      <label>Estado<select name="status" defaultValue={filter.status || ""}><option value="">Todos</option>{orderFilterStates.map(s => <option key={s} value={s}>{crmStatus(s)}</option>)}</select></label>
      <label>Modalidad<select name="method" defaultValue={filter.method || ""}><option value="">Todas</option><option value="COURIER">Envío por mensajería</option><option value="PICKUP">Retiro en Av. Cramer</option></select></label>
      <label>Venta desde<input type="date" name="from" defaultValue={filter.from} />{filter.from && <small>{crmDate(filter.from + "T12:00:00-03:00")}</small>}</label>
      <label>Venta hasta<input type="date" name="to" defaultValue={filter.to} />{filter.to && <small>{crmDate(filter.to + "T12:00:00-03:00")}</small>}</label>
      <label>Orden<select name="sort" defaultValue={filter.sort}><option value="recent">Más recientes</option><option value="oldest">Más antiguos</option></select></label>
      <button className="button secondary">Filtrar</button><Link href="/pedidos">Limpiar filtros</Link>
    </form>
    {filter.error ? <p role="alert">{filter.error}</p> : <p className="muted">Importe de todos los pedidos filtrados: {formatArs(amount?._sum.totalCents ?? 0)}. Incluye los estados seleccionados; no equivale a cobros ni ventas entregadas. Fechas de venta en hora argentina.</p>}
    <ListPagination path="/pedidos" query={query} page={page} total={total} />
    <section className="table-wrap" tabIndex={0} aria-label="Listado de pedidos"><table><thead><tr><th>Venta</th><th>Cliente</th><th>Producto</th><th>Entrega</th><th>Total</th><th>Estado</th><th>Fecha de venta</th><th>Acción</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="primary-cell"><Link className="table-primary-link" href={`/pedidos/${order.id}?returnTo=${encodeURIComponent(listUrl("/pedidos", query, page))}`}>#{order.saleNumber}</Link></td><td>{order.recipientName || order.customer.fullName || "Sin nombre"}</td><td>{order.items.map((item) => item.product.name).join(", ") || "—"}</td><td>{order.deliveryMethod === "PICKUP" ? "Retiro en Av. Cramer" : `${order.locality} · Mensajería`}</td><td>{formatArs(order.totalCents)}</td><td><span className={`badge ${order.status === "PENDING_REVIEW" ? "warning" : "neutral"}`}>{orderStatusLabel(order.status, order.deliveryMethod)}</span></td><td className="muted">{crmDate(order.saleDate)}</td><td><OrderStatusActions id={order.id} status={order.status} deliveryMethod={order.deliveryMethod} /></td></tr>)}</tbody></table>{orders.length === 0 ? <div className="empty">No hay pedidos para esta selección. Probá limpiar los filtros.</div> : null}</section>
  </CrmShell>;
}
