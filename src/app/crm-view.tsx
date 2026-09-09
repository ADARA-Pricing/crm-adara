import Link from "next/link";
import { formatArs, getPickupSchedule, LOCAL_ADDRESS } from "@/lib/sales-policy";
import { prisma } from "@/lib/prisma";
import { CrmShell } from "@/components/crm-shell";
import { argentinaDayStart, crmStatus } from "@/lib/crm-display";
import { requireCrmUser } from "@/lib/auth";
import { taskTimingFilter } from "@/lib/crm-task-filters";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireCrmUser();
  const dayStart = argentinaDayStart();
  const now = new Date();
  const weekStart = new Date(dayStart);
  weekStart.setTime(dayStart.getTime() - 6 * 86400000);

  const [openConversations, newLeads, reviewOrders, logisticsOrders, salesToday, salesWeek, recentOrders, recentCustomers] = await Promise.all([
    prisma.conversation.count({ where: { status: { in: ["OPEN", "HUMAN_HANDOFF"] } } }),
    prisma.customer.count({ where: { archivedAt: null, status: "LEAD", createdAt: { gte: dayStart } } }),
    prisma.order.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.count({ where: { status: { in: ["APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED", "READY_FOR_PICKUP"] } } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: dayStart } }, _sum: { totalCents: true } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: weekStart } }, _sum: { totalCents: true } }),
    prisma.order.findMany({ take: 6, orderBy: { updatedAt: "desc" }, include: { customer: true, items: { include: { product: true } } } }),
    prisma.customer.findMany({ where: { archivedAt: null }, take: 5, orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "asc" }], select: { id: true, fullName: true, whatsappProfileName: true, phone: true, funnelStage: true, lastMessagePreview: true, lastMessageAt: true } })
  ]);
  const [overdueTasks, upcomingTasks, todayTasks] = await Promise.all([
    prisma.task.count({ where: taskTimingFilter("overdue", now) }),
    prisma.task.count({ where: taskTimingFilter("upcoming", now) }),
    prisma.task.count({ where: taskTimingFilter("today", now) })
  ]);
  const cards = [
    ["Conversaciones pendientes", String(openConversations), "Abiertas o derivadas a una persona.", "/bandeja?filter=open"],
    ["Leads nuevos", String(newLeads), "Ingresados desde las 00:00 h."],
    ["Pedidos a revisar", String(reviewOrders), "Confirmados por el cliente.", "/pedidos?status=PENDING_REVIEW"],
    ["En logística", String(logisticsOrders), "Aprobados, en preparación o enviados."],
    ["Ventas hoy", formatArs(salesToday._sum.totalCents ?? 0), "Pedidos entregados."],
    ["Ventas 7 días", formatArs(salesWeek._sum.totalCents ?? 0), "Pedidos entregados."],
  ];

  return <CrmShell active="/">
    <header className="topbar"><div><p className="eyebrow">Operación comercial</p><h1>Dashboard</h1><p className="topbar-copy">WhatsApp, ventas y preparación de pedidos en un solo lugar.</p></div><div className="topbar-actions"><Link className="button secondary" href="/embudo">Ver embudo</Link><Link className="button" href="/pedidos">Revisar pedidos</Link></div></header>
      <section className="metric-grid">
        {cards.map(([title, value, detail, href]) => (
          <article key={title} className="metric">
            <span className="metric-label">{title}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span>{href && <Link className="metric-link" href={href}>Ver listado →</Link>}
          </article>
        ))}
      </section>
      <section aria-labelledby="attention-heading"><div className="section-heading"><h2 id="attention-heading">Agenda y atención del equipo</h2><Link href="/tareas">Ver todas las tareas</Link></div><div className="metric-grid">
        <Link className="metric" href="/tareas?timing=overdue"><span className="metric-label">Tareas vencidas</span><strong className="metric-value">{overdueTasks}</strong><span className="metric-detail">Pendientes o en curso, con vencimiento anterior a ahora.</span></Link>
        <Link className="metric" href="/tareas?timing=today"><span className="metric-label">Tareas para hoy</span><strong className="metric-value">{todayTasks}</strong><span className="metric-detail">Día calendario argentino. Puede incluir tareas ya vencidas hoy.</span></Link>
        <Link className="metric" href="/tareas?timing=upcoming"><span className="metric-label">Próximos siete días</span><strong className="metric-value">{upcomingTasks}</strong><span className="metric-detail">Tareas activas que vencen desde ahora.</span></Link>
        <article className="metric"><span className="metric-label">Accesos de atención</span><div className="operational-shortcuts"><Link href="/bandeja?window=closing">Chats con ventana por vencer</Link><Link href="/bandeja?attention=pending">Último mensaje sin respuesta</Link><Link href="/clientes?owner=none">Clientes sin responsable</Link></div></article>
      </div><p className="muted">Los grupos de tareas pueden superponerse. “Sin respuesta” no significa “no leído”.</p></section>
      <section className="dashboard-grid">
        <article className="panel dashboard-panel"><div className="panel-heading"><div><h2>Pedidos recientes</h2><p>Última actividad de venta.</p></div><Link href="/pedidos">Ver todos</Link></div>{recentOrders.length ? <div className="compact-list">{recentOrders.map((order) => <div className="compact-row" key={order.id}><span><strong>{order.customer.fullName ?? "Cliente sin nombre"}</strong><small>{order.items.map(({ product }) => product.name).join(", ") || "Pedido sin ítems"}</small></span><span className="row-end"><b>{formatArs(order.totalCents)}</b><small>{crmStatus(order.status)}</small></span></div>)}</div> : <div className="empty">Todavía no hay pedidos registrados.</div>}</article>
        <article className="panel dashboard-panel"><div className="panel-heading"><div><h2>Atención reciente</h2><p>Datos sincronizados desde WhatsApp.</p></div><Link href="/clientes">Ver clientes</Link></div>{recentCustomers.length ? <div className="compact-list">{recentCustomers.map((customer) => <div className="compact-row" key={customer.id}><span><strong>{customer.fullName || customer.whatsappProfileName || "Contacto sin nombre"}</strong><small>{customer.phone ?? "Número pendiente de identificar"}</small></span><span className="row-end"><b>{crmStatus(customer.funnelStage)}</b><small>{customer.lastMessagePreview ?? "Sin mensaje"}</small></span></div>)}</div> : <div className="empty">Las conversaciones que lleguen desde WhatsApp aparecerán acá.</div>}</article>
      </section>
      <section className="operations-grid"><article className="panel"><h3>Retiro en Av. Cramer</h3><p><strong>{LOCAL_ADDRESS}</strong><br />{getPickupSchedule()}</p><div className="policy-list"><div>Mismo precio con efectivo o transferencia.<span>Con tarjeta en un pago se aplica 7% de recargo; las cuotas se gestionan por la web.</span></div></div></article><article className="panel"><h3>Control antes de logística</h3><div className="policy-list"><div>Cada pedido confirmado queda en revisión.<span>Verificá datos, zona y condición de entrega antes de asignarlo.</span></div><div>La información comercial vive en el catálogo.<span>Precio y envío se toman desde cada producto activo.</span></div></div></article></section>
  </CrmShell>;
}
