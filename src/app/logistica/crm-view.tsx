import { logisticsViews, logisticsViewWhere } from "@/lib/logistics-board";
import { LogisticsSelection, ShipmentCheckbox } from "./selection";
import "./logistics-board.css";
import Link from "next/link";
import { requireCrmUser } from "@/lib/auth";
import { crmStatus } from "@/lib/crm-display";
import { logisticsFilter, logisticsStates } from "@/lib/crm-logistics-filters";
import type { ListQuery } from "@/lib/crm-list-filters";
import { crmDate } from "@/lib/crm-display";
import { orderStatusLabel } from "@/lib/order-status";
import { CrmShell } from "@/components/crm-shell";
import { OrderStatusActions } from "@/components/order-status-actions";
import { updateLogisticsDetails } from "@/app/pedidos/actions";
import { prisma } from "@/lib/prisma";
import { formatArs, getPickupSchedule, LOCAL_ADDRESS } from "@/lib/sales-policy";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { PENDING_REVIEW: "A revisar", APPROVED_FOR_LOGISTICS: "Pendiente", PREPARING: "Preparando", SHIPPED: "En reparto" };
const inputDate = (date: Date | null) => date ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}` : "";

export default async function LogisticsPage({ searchParams }: { searchParams: Promise<ListQuery> }) {
  await requireCrmUser();
  const raw = await searchParams;
  const filter = logisticsFilter(raw);
  const view = logisticsViews.find(([id]) => id === raw.view)?.[0] || "active";
  const { status: _status, ...common } = filter.where;
  const base = { ...common, ...(filter.status ? { status: filter.status } : {}) };
  const counts = filter.error ? logisticsViews.map(() => 0) : await Promise.all(logisticsViews.map(([key]) => prisma.order.count({ where: { AND: [base, logisticsViewWhere(key, filter.today)] } })));
  const tabsQuery = new URLSearchParams(Object.entries(raw).filter(([key, value]) => key !== "view" && typeof value === "string") as [string, string][]);
  const orders = filter.error ? [] : await prisma.order.findMany({ where: { AND: [base, logisticsViewWhere(view, filter.today)] }, orderBy: [{ deliveryDate: { sort: "asc", nulls: "last" } }, { id: "asc" }], include: { customer: true, items: { include: { product: true } } } });
  return <CrmShell active="/logistica"><div className="logistics-board"><header className="topbar"><div><p className="eyebrow">Operación</p><h1>Logística</h1><p className="topbar-copy">Validá, asigná y seguí cada entrega o retiro confirmado.</p></div></header>
    <nav className="shipment-tabs" aria-label="Vistas de logística">{logisticsViews.map(([key, label], index) => <Link key={key} aria-current={view === key ? "page" : undefined} href={`/logistica?${tabsQuery}&view=${key}`}>{label}<span>{counts[index]}</span></Link>)}</nav>
    <form className="bot-date-form"><input type="hidden" name="view" value={view} />
      <label>Buscar<input name="q" defaultValue={filter.q} placeholder="Receptor, teléfono, localidad o responsable" /></label>
      <label>Modalidad<select name="method" defaultValue={filter.method || ""}><option value="">Todas</option><option value="COURIER">Envío por mensajería</option><option value="PICKUP">Retiro en Av. Cramer</option></select></label>
      <label>Estado<select name="status" defaultValue={filter.status || ""}><option value="">Todos los de esta vista</option>{logisticsStates.map(s => <option key={s} value={s}>{crmStatus(s)}</option>)}</select></label>
      <label>Agenda<select name="timing" defaultValue={filter.timing || ""}><option value="">Toda la agenda</option><option value="today">Programados para hoy</option><option value="overdue">Fecha anterior a hoy</option><option value="unscheduled">Sin fecha programada</option></select></label>
      <label>Fecha programada<input name="date" type="date" defaultValue={filter.date} />{filter.date && <small>{crmDate(filter.date + "T12:00:00-03:00")}</small>}</label>
      <button className="button secondary">Filtrar</button><Link href="/logistica">Limpiar filtros</Link>
    </form>
    {filter.error && <p role="alert">{filter.error}</p>}
    <p className="muted">{orders.length} pedidos en esta selección. Los filtros se combinan y utilizan la fecha programada, no la solicitada por el cliente. Los contadores corresponden a esta selección.</p>
    <section className="logistics-summary"><div><strong>{orders.filter((item) => item.status === "PENDING_REVIEW").length}</strong><span>para revisar</span></div><div><strong>{orders.filter((item) => item.status === "APPROVED_FOR_LOGISTICS").length}</strong><span>por preparar</span></div><div><strong>{orders.filter((item) => item.status === "SHIPPED").length}</strong><span>en reparto</span></div><div><strong>{orders.filter((item) => item.status === "READY_FOR_PICKUP").length}</strong><span>listos para retirar</span></div><p><b>Retiro en local:</b> {LOCAL_ADDRESS}. {getPickupSchedule()}</p></section>
    <LogisticsSelection key={`${view}:${JSON.stringify(raw)}`} ids={orders.map(order => order.id)}><section className="logistics-list">{orders.length ? orders.map((order) => <article className="logistics-card" key={order.id}><header><ShipmentCheckbox id={order.id} saleNumber={order.saleNumber} /><div><span className={`badge ${order.status === "PENDING_REVIEW" ? "warning" : "neutral"}`}>{orderStatusLabel(order.status, order.deliveryMethod)}</span><h2><Link href={`/pedidos/${order.id}`}>Venta #{order.saleNumber}</Link> · {order.recipientName || order.customer.fullName || "Cliente sin nombre"}</h2><p>Fecha de venta: {crmDate(order.saleDate)} · Total: {formatArs(order.totalCents)}</p></div><OrderStatusActions id={order.id} status={order.status} deliveryMethod={order.deliveryMethod} /></header><div className="shipment-products">{order.items.map(item => <div key={item.id}><strong>{item.product.name}</strong><span>{item.quantity} unidad{item.quantity === 1 ? "" : "es"}</span><small>SKU: {item.product.sku}</small></div>)}</div>{order.status !== "DELIVERED" && order.deliveryDate && order.deliveryDate < filter.today && <p className="logistics-overdue" role="note">Fecha programada anterior a hoy · verificar si falta completar la entrega o actualizar su registro.</p>}<div className="logistics-details"><div><small>Modalidad</small><strong>{order.deliveryMethod === "PICKUP" ? "Retiro en Av. Cramer" : "Mensajería privada"}</strong></div><div><small>Destino</small><strong>{order.deliveryMethod === "PICKUP" ? LOCAL_ADDRESS : `${order.deliveryAddress}, ${order.locality}`}</strong></div><div><small>Fecha programada</small><strong>{crmDate(order.deliveryDate)}</strong></div><div><small>Teléfono del receptor</small><strong>{order.recipientPhone || order.customer.phone || "Por identificar"}</strong></div><div><small>Franja acordada</small><strong>{order.deliveryTimeWindow || "A coordinar"}</strong></div><div><small>Fecha solicitada</small><strong>{crmDate(order.requestedDate)}</strong></div></div><details className="shipment-edit"><summary>Datos operativos y coordinación</summary><form action={updateLogisticsDetails.bind(null, order.id)} className="logistics-form"><label>Fecha de entrega programada<input name="deliveryDate" type="date" defaultValue={inputDate(order.deliveryDate)} /></label><label>Cadete / responsable<input name="assignedCourier" defaultValue={order.assignedCourier ?? ""} placeholder="Sin asignar" /></label><label>Franja de entrega<input name="deliveryTimeWindow" defaultValue={order.deliveryTimeWindow ?? ""} placeholder={order.deliveryMethod === "PICKUP" ? "Horario de retiro" : "18 a 21 h"} /></label><label className="logistics-note">Nota operativa<input name="logisticsNote" defaultValue={order.logisticsNote ?? ""} placeholder="Indicaciones internas, validación o riesgo" /></label><button className="button secondary" type="submit">Guardar operación</button></form></details></article>) : <div className="empty panel">No hay ventas que coincidan con esta selección. Probá limpiar los filtros.</div>}</section></LogisticsSelection>
  </div></CrmShell>;
}
