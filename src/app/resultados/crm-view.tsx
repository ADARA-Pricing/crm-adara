import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { funnelStages } from "@/lib/funnel-stages";
import { crmResultsRange } from "@/lib/crm-results-range";

export const dynamic = "force-dynamic";

export default async function Results({ searchParams }: { searchParams: Promise<{ days?: string | string[]; from?: string | string[]; to?: string | string[] }> }) {
  await requireCrmUser();
  const range = crmResultsRange(await searchParams);
  if ("error" in range) return <CrmShell active="/resultados"><header className="topbar"><div><p className="eyebrow">Medición comercial</p><h1>Resultados</h1></div></header><section className="panel" role="alert"><p>{range.error}</p><Link href="/resultados">Volver a los últimos 30 días</Link></section></CrmShell>;
  const now = new Date();
  const cohort = { archivedAt: null, createdAt: { gte: range.start, lt: range.end } };
  const [leads, buyers, stages, categories, transitions, createdOrders, approvedOrders, deliveredOrders, deliveredRevenue] = await Promise.all([
    prisma.customer.count({ where: cohort }),
    prisma.customer.count({ where: { ...cohort, orders: { some: { status: "DELIVERED", deliveredAt: { lte: now } } } } }),
    prisma.customer.groupBy({ by: ["funnelStage"], where: cohort, _count: true }),
    prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } }),
    prisma.funnelTransition.groupBy({ by: ["toStage"], where: { createdAt: { gte: range.start, lt: range.end } }, _count: true }),
    prisma.order.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
    prisma.order.count({ where: { status: { in: ["APPROVED_FOR_LOGISTICS", "PREPARING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED"] }, createdAt: { gte: range.start, lt: range.end } } }),
    prisma.order.count({ where: { status: "DELIVERED", deliveredAt: { gte: range.start, lt: range.end } } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: range.start, lt: range.end } }, _sum: { totalCents: true } }),
  ]);
  const rows = await Promise.all(categories.map(async c => ({ name: c.category!, total: await prisma.customer.count({ where: { ...cohort, interestCategories: { has: c.category! } } }), buyers: await prisma.customer.count({ where: { ...cohort, interestCategories: { has: c.category! }, orders: { some: { status: "DELIVERED", deliveredAt: { lte: now } } } } }) })));
  const money = (cents: number | null | undefined) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
  const label = range.days === "custom" ? `${range.from} a ${range.to}` : `últimos ${range.days} días`;
  return <CrmShell active="/resultados"><header className="topbar"><div><p className="eyebrow">Medición comercial</p><h1>Resultados</h1><p>Clientes ingresados y actividad registrada durante {label}.</p></div></header><section className="panel bot-filters"><div className="topbar-actions"><Link className={`button ${range.days === "7" ? "" : "secondary"}`} href="/resultados?days=7">7 días</Link><Link className={`button ${range.days === "30" ? "" : "secondary"}`} href="/resultados?days=30">30 días</Link><Link className={`button ${range.days === "90" ? "" : "secondary"}`} href="/resultados?days=90">90 días</Link></div><form className="bot-date-form" action="/resultados"><input type="hidden" name="days" value="custom" /><label>Desde<input type="date" name="from" defaultValue={range.from} required /></label><label>Hasta<input type="date" name="to" defaultValue={range.to} required /></label><button className="button secondary">Aplicar rango</button></form><p className="muted">Los límites se interpretan por día calendario argentino. Las ventas solo cuentan al alcanzar el estado Entregado.</p></section><section className="metric-grid">{[["Clientes nuevos", leads], ["Clientes que compraron", buyers], ["Conversión de esta cohorte", leads ? `${(buyers / leads * 100).toFixed(1)}%` : "Sin datos"], ["Pedidos creados", createdOrders], ["Pedidos aprobados", approvedOrders], ["Ventas entregadas", deliveredOrders], ["Facturación entregada", money(deliveredRevenue._sum.totalCents)]].map(([label, value]) => <article className="metric" key={label as string}><span>{label}</span><strong className="metric-value">{value}</strong></article>)}</section><section className="panel"><h2>Etapa actual de esos clientes</h2>{funnelStages.map(([stage, stageLabel]) => <p key={stage}>{stageLabel}: {stages.find(s => s.funnelStage === stage)?._count || 0}</p>)}<p>Una etapa actual no demuestra por cuáles etapas pasó el cliente. “Abandonado” es una clasificación del CRM, no una causa de pérdida inferida.</p></section><section className="panel"><h2>Conversión por interés</h2>{rows.map(r => <p key={r.name}>{r.name}: {r.buyers} compradores / {r.total} interesados · {r.total ? `${(r.buyers / r.total * 100).toFixed(1)}%` : "Sin datos"}</p>)}<p>Un cliente puede figurar en varias categorías. Se mide si compró, no si compró un producto de esa misma categoría.</p></section><section className="panel"><h2>Entradas a etapas registradas</h2>{transitions.map(t => <p key={t.toStage}>{funnelStages.find(([s]) => s === t.toStage)?.[1]}: {t._count}</p>)}<p>Historial disponible desde la instalación de esta mejora. Incluye reingresos; no son clientes únicos. No reconstruimos movimientos anteriores.</p></section></CrmShell>;
}
