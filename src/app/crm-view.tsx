import Link from "next/link";
import { formatArs } from "@/lib/sales-policy";
import { prisma } from "@/lib/prisma";
import { CrmShell } from "@/components/crm-shell";
import { argentinaDayStart, crmStatus } from "@/lib/crm-display";
import { requireCrmUser } from "@/lib/auth";
import { taskTimingFilter } from "@/lib/crm-task-filters";
import { duplicateWindowHours, possibleTaskDuplicates } from "@/lib/task-duplicates";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireCrmUser();
  const dayStart = argentinaDayStart();
  const now = new Date();
  const weekStart = new Date(dayStart);
  weekStart.setTime(dayStart.getTime() - 6 * 86400000);

  const [openConversations, newLeads, reviewOrders, logisticsOrders, salesToday, salesWeek, recentOrders, recentCustomers, unassignedCustomers, unidentifiedCustomers, oldestPending, duplicateCandidates] = await Promise.all([
    prisma.conversation.count({ where: { status: { in: ["OPEN", "HUMAN_HANDOFF"] } } }),
    prisma.customer.count({ where: { archivedAt: null, status: "LEAD", createdAt: { gte: dayStart } } }),
    prisma.order.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.count({ where: { status: { in: ["APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED", "READY_FOR_PICKUP"] } } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: dayStart } }, _sum: { totalCents: true } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: weekStart } }, _sum: { totalCents: true } }),
    prisma.order.findMany({ take: 6, orderBy: { updatedAt: "desc" }, include: { customer: true, items: { include: { product: true } } } }),
    prisma.customer.findMany({ where: { archivedAt: null }, take: 5, orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "asc" }], select: { id: true, fullName: true, whatsappProfileName: true, phone: true, funnelStage: true, lastMessagePreview: true, lastMessageAt: true } }),
    prisma.customer.count({ where: { archivedAt: null, assigneeId: null } }),
    prisma.customer.count({ where: { archivedAt: null, AND: [{ fullName: null }, { whatsappProfileName: null }] } }),
    prisma.conversation.aggregate({ where: { status: { in: ["OPEN", "HUMAN_HANDOFF"] } }, _min: { updatedAt: true } }),
    prisma.task.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { createdAt: "desc" }, take: 1001, select: { id: true, title: true, type: true, status: true, customerId: true, orderId: true, createdAt: true } })
  ]);
  const [overdueTasks, upcomingTasks, todayTasks] = await Promise.all([
    prisma.task.count({ where: taskTimingFilter("overdue", now) }),
    prisma.task.count({ where: taskTimingFilter("upcoming", now) }),
    prisma.task.count({ where: taskTimingFilter("today", now) })
  ]);
  const duplicateTasks = possibleTaskDuplicates(duplicateCandidates.slice(0, 1000), duplicateWindowHours(process.env.CRM_TASK_DUPLICATE_WINDOW_HOURS)).size;
  const oldestPendingHours = oldestPending._min.updatedAt ? Math.max(0, Math.floor((now.getTime() - oldestPending._min.updatedAt.getTime()) / 3600000)) : null;
  const priorityCards = [
    ["Conversaciones pendientes", String(openConversations), "Abiertas o derivadas a una persona.", "/bandeja?filter=open"],
    ["Leads nuevos", String(newLeads), "Ingresados desde las 00:00 h.", "/clientes"],
    ["Pedidos a revisar", String(reviewOrders), "Confirmados por el cliente.", "/pedidos?status=PENDING_REVIEW"],
    ["En logística", String(logisticsOrders), "Aprobados, en preparación o enviados.", "/logistica"],
  ];
  const attentionCards = [
    ["Clientes sin responsable", String(unassignedCustomers), "Activos sin una persona asignada.", "/clientes?quality=owner"],
    ["Contactos sin identificar", String(unidentifiedCustomers), "Sin nombre ni perfil de WhatsApp.", "/clientes?quality=name"],
    ["Atención pendiente más antigua", oldestPendingHours == null ? "Sin datos" : `${oldestPendingHours} h`, "Abierta o derivada, según última actualización.", "/bandeja?filter=open"],
    ["Tareas con posible duplicado", String(duplicateTasks), "Coincidencias a revisar; no se modificó ninguna tarea.", "/tareas"],
  ];

  return <CrmShell active="/">
    <header className="topbar"><div><p className="eyebrow">Operación comercial</p><h1>Dashboard</h1><p className="topbar-copy">WhatsApp, ventas y preparación de pedidos en un solo lugar.</p><p className="muted">Actualizado al abrir el panel: {now.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}.</p></div><div className="topbar-actions"><Link className="button secondary" href="/embudo">Ver embudo</Link><Link className="button" href="/pedidos">Revisar pedidos</Link></div></header>
      <section className="metric-grid dashboard-priority-grid">
        {priorityCards.map(([title, value, detail, href]) => (
          <Link key={title} className="metric dashboard-priority-card" href={href!}>
            <span className="metric-label">{title}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span><span className="metric-link">Abrir listado →</span>
          </Link>
        ))}
      </section>
      <section aria-labelledby="attention-heading"><div className="section-heading"><h2 id="attention-heading">Atención requerida</h2><Link href="/tareas">Ver todas las tareas</Link></div><div className="metric-grid dashboard-attention-grid">
        {attentionCards.map(([title, value, detail, href]) => <Link key={title} className="metric" href={href!}><span className="metric-label">{title}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></Link>)}
        <Link className="metric" href="/tareas?timing=overdue"><span className="metric-label">Tareas vencidas</span><strong className="metric-value">{overdueTasks}</strong><span className="metric-detail">Pendientes o en curso, con vencimiento anterior a ahora.</span></Link>
        <Link className="metric" href="/tareas?timing=today"><span className="metric-label">Tareas para hoy</span><strong className="metric-value">{todayTasks}</strong><span className="metric-detail">Día calendario argentino. Puede incluir tareas ya vencidas hoy.</span></Link>
        <Link className="metric" href="/tareas?timing=upcoming"><span className="metric-label">Próximos siete días</span><strong className="metric-value">{upcomingTasks}</strong><span className="metric-detail">Tareas activas que vencen desde ahora.</span></Link>
        <article className="metric"><span className="metric-label">Accesos de atención</span><div className="operational-shortcuts"><Link href="/bandeja?window=closing">Chats con ventana por vencer</Link><Link href="/bandeja?attention=pending">Último mensaje sin respuesta</Link><Link href="/clientes?owner=none">Clientes sin responsable</Link></div></article>
      </div><p className="muted">Los grupos de tareas pueden superponerse. “Sin respuesta” no significa “no leído”.</p></section>
      <section className="section-heading"><h2>Ventas y operación</h2><span className="muted">Solo pedidos entregados para importes vendidos.</span></section><section className="metric-grid dashboard-operation-grid"><article className="metric"><span className="metric-label">Ventas hoy</span><strong className="metric-value">{formatArs(salesToday._sum.totalCents ?? 0)}</strong><span className="metric-detail">Pedidos entregados hoy.</span></article><article className="metric"><span className="metric-label">Ventas 7 días</span><strong className="metric-value">{formatArs(salesWeek._sum.totalCents ?? 0)}</strong><span className="metric-detail">Pedidos entregados en los últimos siete días.</span></article></section>
      <section className="dashboard-grid">
        <article className="panel dashboard-panel"><div className="panel-heading"><div><h2>Pedidos recientes</h2><p>Última actividad de venta.</p></div><Link href="/pedidos">Ver todos</Link></div>{recentOrders.length ? <div className="compact-list">{recentOrders.map((order) => <div className="compact-row" key={order.id}><span><strong>{order.customer.fullName ?? "Cliente sin nombre"}</strong><small>{order.items.map(({ product }) => product.name).join(", ") || "Pedido sin ítems"}</small></span><span className="row-end"><b>{formatArs(order.totalCents)}</b><small>{crmStatus(order.status)}</small></span></div>)}</div> : <div className="empty">Todavía no hay pedidos registrados.</div>}</article>
        <article className="panel dashboard-panel"><div className="panel-heading"><div><h2>Atención reciente</h2><p>Datos sincronizados desde WhatsApp.</p></div><Link href="/clientes">Ver clientes</Link></div>{recentCustomers.length ? <div className="compact-list">{recentCustomers.map((customer) => <div className="compact-row" key={customer.id}><span><strong>{customer.fullName || customer.whatsappProfileName || "Contacto sin nombre"}</strong><small>{customer.phone ?? "Número pendiente de identificar"}</small></span><span className="row-end"><b>{crmStatus(customer.funnelStage)}</b><small>{customer.lastMessagePreview ?? "Sin mensaje"}</small></span></div>)}</div> : <div className="empty">Las conversaciones que lleguen desde WhatsApp aparecerán acá.</div>}</article>
      </section>
      <section className="operations-grid"><article className="panel"><h3>Operación de ventas</h3><div className="policy-list"><div>Elegí la modalidad con el cliente.<span>Los pedidos nuevos se coordinan por mensajería privada o para retiro en Av. Cramer 2548, CABA.</span></div><div>La información comercial vive en el catálogo.<span>Precio y envío se toman desde cada producto activo.</span></div></div></article><article className="panel"><h3>Retiro en local</h3><p>Av. Cramer 2548, Belgrano (Cramer y Monroe). Lunes a viernes de 10 a 19 h; sábados de 11 a 15 h.</p></article></section>
  </CrmShell>;
}
