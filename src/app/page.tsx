import Link from "next/link";
import { formatArs, getPickupSchedule, LOCAL_ADDRESS } from "@/lib/sales-policy";
import { prisma } from "@/lib/prisma";
import { CrmShell } from "@/components/crm-shell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [openConversations, newLeads, reviewOrders, logisticsOrders, salesToday, salesWeek, recentOrders, recentCustomers] = await Promise.all([
    prisma.conversation.count({ where: { status: { in: ["OPEN", "HUMAN_HANDOFF"] } } }),
    prisma.customer.count({ where: { status: "LEAD", createdAt: { gte: dayStart } } }),
    prisma.order.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.count({ where: { status: { in: ["APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED"] } } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", updatedAt: { gte: dayStart } }, _sum: { totalCents: true } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", updatedAt: { gte: weekStart } }, _sum: { totalCents: true } }),
    prisma.order.findMany({ take: 6, orderBy: { updatedAt: "desc" }, include: { customer: true, items: { include: { product: true } } } }),
    prisma.customer.findMany({ take: 5, orderBy: { lastMessageAt: "desc" }, select: { id: true, fullName: true, phone: true, funnelStage: true, lastMessagePreview: true, lastMessageAt: true } })
  ]);
  const cards = [
    ["Conversaciones pendientes", String(openConversations), "Abiertas o derivadas a una persona."],
    ["Leads nuevos", String(newLeads), "Ingresados desde las 00:00 h."],
    ["Pedidos a revisar", String(reviewOrders), "Confirmados por el cliente."],
    ["En logística", String(logisticsOrders), "Aprobados, en preparación o enviados."],
    ["Ventas hoy", formatArs(salesToday._sum.totalCents ?? 0), "Pedidos entregados."],
    ["Ventas 7 días", formatArs(salesWeek._sum.totalCents ?? 0), "Pedidos entregados."],
  ];

  return <CrmShell active="/">
    <header className="topbar"><div><p className="eyebrow">Operación comercial</p><h1>Dashboard</h1><p className="topbar-copy">WhatsApp, ventas y preparación de pedidos en un solo lugar.</p></div><div className="topbar-actions"><Link className="button secondary" href="/embudo">Ver embudo</Link><Link className="button" href="/pedidos">Revisar pedidos</Link></div></header>
      <section className="metric-grid">
        {cards.map(([title, value, detail]) => (
          <article key={title} className="metric">
            <span className="metric-label">{title}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel dashboard-panel"><div className="panel-heading"><div><h2>Pedidos recientes</h2><p>Última actividad de venta.</p></div><Link href="/pedidos">Ver todos</Link></div>{recentOrders.length ? <div className="compact-list">{recentOrders.map((order) => <div className="compact-row" key={order.id}><span><strong>{order.customer.fullName ?? "Cliente sin nombre"}</strong><small>{order.items.map(({ product }) => product.name).join(", ") || "Pedido sin ítems"}</small></span><span className="row-end"><b>{formatArs(order.totalCents)}</b><small>{order.status.replaceAll("_", " ")}</small></span></div>)}</div> : <div className="empty">Todavía no hay pedidos registrados.</div>}</article>
        <article className="panel dashboard-panel"><div className="panel-heading"><div><h2>Atención reciente</h2><p>Datos sincronizados desde WhatsApp.</p></div><Link href="/clientes">Ver clientes</Link></div>{recentCustomers.length ? <div className="compact-list">{recentCustomers.map((customer) => <div className="compact-row" key={customer.id}><span><strong>{customer.fullName ?? "Contacto sin nombre"}</strong><small>{customer.phone ?? "Número pendiente de identificar"}</small></span><span className="row-end"><b>{customer.funnelStage.replaceAll("_", " ")}</b><small>{customer.lastMessagePreview ?? "Sin mensaje"}</small></span></div>)}</div> : <div className="empty">Las conversaciones que lleguen desde WhatsApp aparecerán acá.</div>}</article>
      </section>
      <section className="operations-grid"><article className="panel"><h3>Retiro en Av. Cramer</h3><p><strong>{LOCAL_ADDRESS}</strong><br />{getPickupSchedule()}</p><div className="policy-list"><div>Mismo precio con efectivo o transferencia.<span>Con tarjeta en un pago se aplica 7% de recargo; las cuotas se gestionan por la web.</span></div></div></article><article className="panel"><h3>Control antes de logística</h3><div className="policy-list"><div>Cada pedido confirmado queda en revisión.<span>Verificá datos, zona y condición de entrega antes de asignarlo.</span></div><div>La información comercial vive en el catálogo.<span>Precio y envío se toman desde cada producto activo.</span></div></div></article></section>
  </CrmShell>;
}
