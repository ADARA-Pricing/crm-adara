import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { funnelStages } from "@/lib/funnel-stages";
import { crmResultsRange } from "@/lib/crm-results-range";
import { crmDate } from "@/lib/crm-display";

export const dynamic = "force-dynamic";

function CountBars({ title, description, items }: { title: string; description: string; items: Array<{ label: string; value: number; detail?: string }> }) {
  const max = Math.max(1, ...items.map(item => item.value));
  return <section className="panel result-bars"><header><h2>{title}</h2><p>{description}</p></header>{items.length ? <ul>{items.map(item => <li key={item.label}><span><strong>{item.label}</strong>{item.detail ? <small>{item.detail}</small> : null}</span><b>{item.value.toLocaleString("es-AR")}</b><progress value={item.value} max={max} aria-label={`${item.label}: ${item.value.toLocaleString("es-AR")}`} /></li>)}</ul> : <div className="empty">Sin datos para representar en este período.</div>}</section>;
}

export default async function Results({ searchParams }: { searchParams: Promise<{ days?: string | string[]; from?: string | string[]; to?: string | string[] }> }) {
  await requireCrmUser();
  const range = crmResultsRange(await searchParams);
  if ("error" in range) return <CrmShell active="/resultados"><header className="topbar"><div><p className="eyebrow">Medición comercial</p><h1>Resultados</h1></div></header><section className="panel" role="alert"><p>{range.error}</p><Link href="/resultados">Volver a los últimos 30 días</Link></section></CrmShell>;
  const now = new Date();
  const cohort = { archivedAt: null, createdAt: { gte: range.start, lt: range.end } };
  const [leads, buyers, stages, categories, transitions, createdOrders, approvedOrders, deliveredOrders, deliveredRevenue, ownerLeads, ownerBuyers, users] = await Promise.all([
    prisma.customer.count({ where: cohort }),
    prisma.customer.count({ where: { ...cohort, orders: { some: { status: "DELIVERED", deliveredAt: { lte: now } } } } }),
    prisma.customer.groupBy({ by: ["funnelStage"], where: cohort, _count: true }),
    prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } }),
    prisma.funnelTransition.groupBy({ by: ["toStage"], where: { createdAt: { gte: range.start, lt: range.end } }, _count: true }),
    prisma.order.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
    prisma.order.count({ where: { status: { in: ["APPROVED_FOR_LOGISTICS", "PREPARING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED"] }, createdAt: { gte: range.start, lt: range.end } } }),
    prisma.order.count({ where: { status: "DELIVERED", deliveredAt: { gte: range.start, lt: range.end } } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: range.start, lt: range.end } }, _sum: { totalCents: true } }),
    prisma.customer.groupBy({ by: ["assigneeId"], where: cohort, _count: true }),
    prisma.customer.groupBy({ by: ["assigneeId"], where: { ...cohort, orders: { some: { status: "DELIVERED", deliveredAt: { lte: now } } } }, _count: true }),
    prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } }),
  ]);
  const rows = await Promise.all(categories.map(async c => ({ name: c.category!, total: await prisma.customer.count({ where: { ...cohort, interestCategories: { has: c.category! } } }), buyers: await prisma.customer.count({ where: { ...cohort, interestCategories: { has: c.category! }, orders: { some: { status: "DELIVERED", deliveredAt: { lte: now } } } } }) })));
  const ownerRows = ownerLeads.map(owner => ({ id: owner.assigneeId, leads: owner._count, buyers: ownerBuyers.find(item => item.assigneeId === owner.assigneeId)?._count || 0 })).sort((a, b) => b.leads - a.leads);
  const ownerName = (id: string | null) => id ? users.find(user => user.id === id)?.displayName || users.find(user => user.id === id)?.email || "Responsable inactivo" : "Sin responsable";
  const money = (cents: number | null | undefined) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
  const label = range.days === "custom" ? `${crmDate(range.from)} a ${crmDate(range.to)}` : `últimos ${range.days} días`;
  const currentStages = funnelStages.map(([stage, stageLabel]) => ({ label: stageLabel, value: stages.find(s => s.funnelStage === stage)?._count || 0 }));
  const categoryBars = rows.map(row => ({ label: row.name, value: row.total, detail: `${row.buyers} compradores` }));
  const transitionBars = transitions.map(transition => ({ label: funnelStages.find(([stage]) => stage === transition.toStage)?.[1] || "Etapa por verificar", value: transition._count }));
  return <CrmShell active="/resultados"><header className="topbar"><div><p className="eyebrow">Medición comercial</p><h1>Resultados</h1><p>Clientes ingresados y actividad registrada durante {label}.</p></div></header><section className="panel bot-filters"><div className="topbar-actions"><Link className={`button ${range.days === "7" ? "" : "secondary"}`} href="/resultados?days=7">7 días</Link><Link className={`button ${range.days === "30" ? "" : "secondary"}`} href="/resultados?days=30">30 días</Link><Link className={`button ${range.days === "90" ? "" : "secondary"}`} href="/resultados?days=90">90 días</Link></div><form className="bot-date-form" action="/resultados"><input type="hidden" name="days" value="custom" /><label>Desde<input type="date" name="from" defaultValue={range.from} required /></label><label>Hasta<input type="date" name="to" defaultValue={range.to} required /></label><button className="button secondary">Aplicar rango</button></form><p className="muted">Los límites se interpretan por día calendario argentino. Las ventas solo cuentan al alcanzar el estado Entregado.</p></section><section className="metric-grid results-kpis">{[["Clientes nuevos", leads], ["Clientes que compraron", buyers], ["Conversión de esta cohorte", leads ? `${(buyers / leads * 100).toFixed(1)}%` : "Sin datos"], ["Pedidos creados", createdOrders], ["Pedidos aprobados", approvedOrders], ["Ventas entregadas", deliveredOrders], ["Facturación entregada", money(deliveredRevenue._sum.totalCents)]].map(([label, value]) => <article className="metric" key={label as string}><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong></article>)}</section><section className="results-visual-grid"><CountBars title="Etapa actual" description="Fotografía actual de los clientes de esta cohorte; no prueba por qué etapas pasó cada uno." items={currentStages} /><CountBars title="Interés por categoría" description="Un cliente puede estar en más de una categoría. Se informa interés, no atribución de venta." items={categoryBars} /><CountBars title="Entradas a etapas" description="Movimientos registrados en el período; puede incluir reingresos y no reconstruye el historial anterior." items={transitionBars} /></section><section className="panel"><h2>Conversión por responsable</h2>{ownerRows.length ? ownerRows.map(owner => <p key={owner.id || "unassigned"}>{ownerName(owner.id)}: {owner.buyers} compradores / {owner.leads} clientes nuevos · {owner.leads ? `${(owner.buyers / owner.leads * 100).toFixed(1)}%` : "Sin datos"}</p>) : <p>Sin clientes nuevos en el período.</p>}<p>Se agrupa por el responsable actual del cliente. No reconstruye asignaciones históricas ni atribuye una venta a una persona si no hay ese dato.</p></section></CrmShell>;
}
