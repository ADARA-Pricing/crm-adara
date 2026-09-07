import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyticsRange, ratio, totalMetric } from "@/lib/bot-analytics";
import { getBotAnalytics } from "@/lib/bot-analytics-server";

export const dynamic = "force-dynamic";
const number = (n: number | null | undefined) => n == null ? "Sin datos" : n.toLocaleString("es-AR");
const usd = (n: number | null | undefined) => n == null ? "Sin datos" : `USD ${n.toLocaleString("es-AR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

export default async function BotPage({ searchParams }: { searchParams: Promise<{ days?: string; from?: string; to?: string }> }) {
  await requireCrmUser();
  const range = analyticsRange(await searchParams);
  if ("error" in range) return <CrmShell active="/bot"><h1>Bot</h1><p role="alert">{range.error}</p><Link href="/bot">Volver a los últimos 30 días</Link></CrmShell>;
  const period = { gte: new Date(range.start), lte: new Date(range.end) };
  const [analytics, channels, completed] = await Promise.all([
    getBotAnalytics(range.start, range.end),
    prisma.conversation.groupBy({ by: ["channel"], where: { createdAt: period, botpressId: { not: null } }, _count: true }),
    prisma.order.count({ where: { status: "DELIVERED", deliveredAt: period } }),
  ]);
  const records = "records" in analytics ? analytics.records : [];
  const sum = (select: Parameters<typeof totalMetric>[1]) => totalMetric(records, select);
  const cost = sum(r => r.llm?.cost?.sum);
  const conversations = sum(r => r.conversationsCreated);
  const cards = [
    ["Gasto de IA", usd(cost), "Consumo informado por Botpress, no factura total."],
    ["Conversaciones nuevas", number(conversations), "Creadas en Botpress durante el período; todos los canales."],
    ["Usuarios nuevos", number(sum(r => r.newUsers)), "Nuevos según Botpress; no equivale al total de usuarios únicos activos."],
    ["Mensajes recibidos", number(sum(r => r.userMessages)), "Mensajes de usuarios informados por Botpress."],
    ["Mensajes del bot", number(sum(r => r.botMessages)), "No implica que todos hayan sido entregados."],
    ["Tokens de entrada", number(sum(r => r.llm?.inputTokens)), "Incluyen contexto e instrucciones enviados al modelo."],
    ["Tokens de salida", number(sum(r => r.llm?.outputTokens)), "Tokens generados por los modelos."],
    ["Llamadas de IA", number(sum(r => r.llm?.calls)), "Una conversación puede requerir varias llamadas."],
    ["Errores de IA", number(sum(r => r.llm?.errors)), "Errores del modelo, no fallos de entrega de WhatsApp."],
    ["Gasto / conversación nueva", usd(ratio(cost, conversations)), "Cociente del período; incluye consumo de conversaciones anteriores."],
  ];
  return <CrmShell active="/bot">
    <header className="topbar"><div><p className="eyebrow">Control y rendimiento</p><h1>Bot</h1><p className="topbar-copy">Actividad y consumo real de Botpress, sin gastar tokens para calcular estadísticas.</p></div></header>
    <section className="panel bot-filters">
      <div className="topbar-actions"><Link className={`button ${range.days === "7" ? "" : "secondary"}`} href="/bot?days=7">Últimos 7 días</Link><Link className={`button ${range.days === "30" ? "" : "secondary"}`} href="/bot?days=30">Últimos 30 días</Link></div>
      <form className="bot-date-form" action="/bot"><input type="hidden" name="days" value="custom" /><label>Desde<input type="date" name="from" defaultValue={range.from} required /></label><label>Hasta<input type="date" name="to" defaultValue={range.to} required /></label><button className="button secondary" type="submit">Aplicar rango</button></form>
      <p>Período: {range.from} al {range.to} · Calendario UTC de Botpress (3 horas por delante de Argentina). Hoy puede estar incompleto.</p>
      <p>{"syncedAt" in analytics ? `Última consulta: ${new Date(analytics.syncedAt).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })}. Caché de 5 minutos; se renueva al consultar el panel. Botpress puede demorar en consolidar los datos.` : "Sin sincronización disponible."}</p>
    </section>
    {"error" in analytics && <section className="panel" role="alert">{analytics.error}</section>}
    {!records.length && !("error" in analytics) && <section className="panel">Botpress no devolvió registros para este período. Esto no confirma consumo cero.</section>}
    <section className="metric-grid">{cards.map(([label, value, detail]) => <article className="metric" key={label}><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>)}</section>
    <section className="panel"><h2>Evolución informada por Botpress</h2><p>Todos los canales, incluidas las pruebas web. Los períodos sin registros no se completan con ceros.</p><div className="bot-table-scroll"><table className="bot-table"><thead><tr><th>Período UTC</th><th>Conversaciones</th><th>Recibidos</th><th>Del bot</th><th>Tokens entrada</th><th>Tokens salida</th><th>Gasto IA</th></tr></thead><tbody>{[...records].sort((a,b) => a.startDateTimeUtc.localeCompare(b.startDateTimeUtc)).map((r, i) => <tr key={`${r.startDateTimeUtc}-${i}`}><td>{r.startDateTimeUtc.slice(0,16).replace("T"," ")}<br />a {r.endDateTimeUtc.slice(0,16).replace("T"," ")}</td><td>{number(r.conversationsCreated)}</td><td>{number(r.userMessages)}</td><td>{number(r.botMessages)}</td><td>{number(r.llm?.inputTokens)}</td><td>{number(r.llm?.outputTokens)}</td><td>{usd(r.llm?.cost?.sum)}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><h2>Referencia comercial del CRM</h2><p>Conversaciones vinculadas a Botpress registradas por primera vez en el CRM durante el período. No equivale a usuarios únicos ni garantiza el histórico completo de Botpress.</p><div className="policy-list">{channels.map(c => <div key={c.channel}>{c.channel}: {number(c._count)}</div>)}<div>Ventas entregadas o retiradas en el período: {number(completed)}<span>Todos los orígenes del CRM. No se calcula costo por venta hasta vincular con precisión el consumo y las ventas del bot.</span></div></div></section>
    <section className="panel"><h2>Cómo interpretar el gasto</h2><p>El importe es consumo de IA en USD. No incluye abono de Botpress, cargos de Meta, impuestos ni otros servicios. No es saldo disponible ni un límite de gasto.</p><p>La API agregada no separa el consumo por canal ni identifica usuarios únicos del período. Esos datos no se estiman a partir de sesiones ni de la caché de chats.</p></section>
  </CrmShell>;
}
