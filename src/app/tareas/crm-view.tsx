import { taskTimingFilter } from "@/lib/crm-task-filters";
import { crmDate } from "@/lib/crm-display";
import { CrmShell } from "@/components/crm-shell";
import { TaskActions } from "@/components/task-actions";
import { createTask } from "@/app/tareas/actions";
import Link from "next/link";
import { requireCrmUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { duplicateWindowHours, possibleTaskDuplicates } from "@/lib/task-duplicates";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { FOLLOW_UP: "Seguimiento", DELIVERY_CONFIRMATION: "Confirmar entrega", ORDER_REVIEW: "Revisar pedido", LOGISTICS: "Logística", OTHER: "General" };
const statusLabels: Record<string, string> = { OPEN: "Pendiente", IN_PROGRESS: "En curso", DONE: "Completada", CANCELLED: "Cancelada" };

const one = (value: string | string[] | undefined) => typeof value === "string" ? value.trim().slice(0, 120) : "";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ owner?: string | string[]; timing?: string | string[]; type?: string | string[]; customer?: string | string[]; order?: string | string[]; sort?: string | string[] }> }) {
  const user = await requireCrmUser(); const raw = await searchParams;
  const owner = one(raw.owner), timing = one(raw.timing), type = one(raw.type), customerId = one(raw.customer), orderId = one(raw.order), requestedSort = one(raw.sort);
  const sort = ["due", "due_desc", "recent", "customer", "customer_desc", "owner", "owner_desc", "status", "status_desc"].includes(requestedSort) ? requestedSort : "due";
  const where: Prisma.TaskWhereInput = taskTimingFilter(timing);
  if(owner === "mine") where.assigneeId = user.id;
  if(owner === "none") where.assigneeId = null;
  if (["FOLLOW_UP", "DELIVERY_CONFIRMATION", "ORDER_REVIEW", "LOGISTICS", "OTHER"].includes(type)) where.type = type as Prisma.EnumTaskTypeFilter;
  if (customerId) where.customerId = customerId;
  if (orderId) where.orderId = orderId;
  const taskOrderBy: Prisma.TaskOrderByWithRelationInput[] = sort === "recent" ? [{ createdAt: "desc" }, { id: "asc" }]
    : sort === "customer" ? [{ customerId: "asc" }, { dueAt: "asc" }, { id: "asc" }]
    : sort === "customer_desc" ? [{ customerId: "desc" }, { dueAt: "asc" }, { id: "asc" }]
    : sort === "owner" ? [{ assignee: { displayName: "asc" } }, { dueAt: "asc" }, { id: "asc" }]
    : sort === "owner_desc" ? [{ assignee: { displayName: "desc" } }, { dueAt: "asc" }, { id: "asc" }]
    : sort === "status" ? [{ status: "asc" }, { dueAt: "asc" }, { id: "asc" }]
    : sort === "status_desc" ? [{ status: "desc" }, { dueAt: "asc" }, { id: "asc" }]
    : sort === "due_desc" ? [{ dueAt: "desc" }, { createdAt: "desc" }, { id: "asc" }]
    : [{ dueAt: "asc" }, { createdAt: "desc" }, { id: "asc" }];

  const sortHref = (next: string) => {
    const query = new URLSearchParams(Object.entries(raw).filter(([key, value]) => key !== "sort" && typeof value === "string" && value) as [string, string][]);
    query.set("sort", next);
    return `/tareas?${query}`;
  };
  const SortHeader = ({ label, ascending, descending }: { label: string; ascending: string; descending: string }) => {
    const active = sort === ascending || sort === descending;
    const direction = sort === descending ? "↓" : "↑";
    return <Link className={`task-sort-header${active ? " active" : ""}`} href={sortHref(sort === ascending ? descending : ascending)} aria-label={`Ordenar por ${label} ${sort === ascending ? "descendente" : "ascendente"}`}>{label}<span aria-hidden="true">{active ? direction : "↕"}</span></Link>;
  };

  const [tasks, customers, orders, users, duplicateCandidates] = await Promise.all([prisma.task.findMany({ where, take: 80, orderBy: taskOrderBy, include: { customer: true, order: true, assignee: true } }), prisma.customer.findMany({ where: { archivedAt: null }, take: 80, orderBy: { updatedAt: "desc" }, select: { id: true, fullName: true, whatsappProfileName: true, phone: true } }), prisma.order.findMany({ take: 80, orderBy: { createdAt: "desc" }, include: { customer: true } }), prisma.userProfile.findMany({ where: { isActive: true }, orderBy: { email: "asc" } }), prisma.task.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { createdAt: "desc" }, take: 1001, select: { id: true, title: true, type: true, status: true, customerId: true, orderId: true, createdAt: true } })]);
  const hours = duplicateWindowHours(process.env.CRM_TASK_DUPLICATE_WINDOW_HOURS);
  const duplicates = possibleTaskDuplicates(duplicateCandidates.slice(0, 1000), hours);
  return <CrmShell active="/tareas"><header className="topbar"><div><p className="eyebrow">Operación</p><h1>Tareas</h1><p className="topbar-copy">Seguimientos, validaciones y entregas asignados al equipo.</p></div></header>
    <section className="panel context-note" aria-label="Revisión de posibles duplicados"><strong>{duplicates.size} tareas con posible duplicado</strong><p>Coincidencias por cliente o pedido, tipo y título dentro de {hours} horas. No confirma que sean de la misma conversación. No se modificó ninguna tarea.</p>{duplicateCandidates.length > 1000 && <p>Revisión parcial: 1000 tareas activas más recientes.</p>}<small>Los filtros pueden ocultar otras coincidencias.</small></section>
    <form className="panel topbar-actions task-filter-bar"><label>Responsable<select name="owner" defaultValue={owner}><option value="">Todos</option><option value="mine">Mis tareas</option><option value="none">Sin asignar</option></select></label><label>Plazo<select name="timing" defaultValue={timing}><option value="">Todos</option><option value="overdue">Vencidas</option><option value="today">Hoy</option><option value="completed">Completadas</option><option value="upcoming">Próximos 7 días</option></select></label><label>Tipo<select name="type" defaultValue={type}><option value="">Todos</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><details className="task-filter-more"><summary>Más filtros</summary><label>Cliente<select name="customer" defaultValue={customerId}><option value="">Todos</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.fullName || customer.whatsappProfileName || customer.phone || "Contacto sin nombre"}</option>)}</select></label><label>Pedido<select name="order" defaultValue={orderId}><option value="">Todos</option>{orders.map(order => <option key={order.id} value={order.id}>#{order.id.slice(-6)} · {order.recipientName || order.customer.fullName || "Pedido"}</option>)}</select></label></details><button className="button secondary">Filtrar</button><Link href="/tareas">Limpiar</Link></form><details className="task-create panel"><summary className="button">Nueva tarea</summary><div className="task-create-content"><h2>Crear una tarea</h2><p className="muted">Asignalá, vinculala y definí el próximo paso sin salir del listado.</p><form action={createTask} className="task-form"><label>Tarea<input name="title" required placeholder="Ej.: confirmar disponibilidad para mañana" /></label><label>Tipo<select name="type" defaultValue="FOLLOW_UP">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Vencimiento<input name="dueAt" type="datetime-local" /></label><label>Asignar a<select name="assigneeId"><option value="">A mí</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName || user.email}</option>)}</select></label><label>Cliente<select name="customerId"><option value="">Sin vincular</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName || customer.whatsappProfileName || customer.phone || "Contacto sin nombre"}</option>)}</select></label><label>Pedido<select name="orderId"><option value="">Sin vincular</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.recipientName || order.customer.fullName || "Pedido"} · {crmDate(order.createdAt)}</option>)}</select></label><label className="task-description">Detalle<input name="description" placeholder="Contexto interno o próximo paso" /></label><button className="button" type="submit">Crear tarea</button></form></div></details>
    <section className="section-heading"><h2>{timing === "completed" ? "Tareas completadas" : "Seguimiento de tareas"}</h2><span className="muted">{tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED").length} activas · {tasks.length} mostradas</span></section><section className="panel task-table"><table><thead><tr><th>Tarea</th><th>Vinculada a</th><th><SortHeader label="Responsable" ascending="owner" descending="owner_desc" /></th><th><SortHeader label="Vencimiento" ascending="due" descending="due_desc" /></th><th><SortHeader label="Estado" ascending="status" descending="status_desc" /></th><th></th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id} id={`task-${task.id}`}><td><strong>{task.title}</strong>{duplicates.has(task.id) && <span className="badge warning">Posible duplicado · {duplicates.get(task.id)!.length}</span>}<small>{labels[task.type]}</small>{task.description && <details><summary>Ver detalle</summary><p>{task.description}</p></details>}</td><td>{task.customer ? <Link href={`/embudo?lead=${task.customer.id}`}>{task.customer.fullName || task.customer.whatsappProfileName || task.customer.phone || "Cliente"}</Link> : task.order ? `Pedido · ${task.order.recipientName}` : "—"}</td><td>{task.assignee?.displayName || task.assignee?.email || "Sin asignar"}</td><td>{task.dueAt ? crmDate(task.dueAt, true) : "Sin fecha"}</td><td><span className={`badge ${task.status === "OPEN" ? "warning" : task.status === "DONE" ? "" : "neutral"}`}>{statusLabels[task.status]}</span></td><td><TaskActions id={task.id} status={task.status} /></td></tr>)}</tbody></table>{!tasks.length ? <div className="empty">Todavía no hay tareas. Creá la primera para organizar el seguimiento operativo.</div> : null}</section>
  </CrmShell>;
}
