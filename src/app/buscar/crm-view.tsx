import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { searchCrm } from "@/lib/crm-search-server";
import { crmDate, crmPhone, crmStatus } from "@/lib/crm-display";
import { orderStatusLabel } from "@/lib/order-status";
import type { ReactNode } from "react";
export const dynamic = "force-dynamic";
function Results({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="panel search-results"><h2>{title}</h2><p className="muted">{count > 10 ? "Más de 10 coincidencias. Se muestran las primeras 10; acotá la búsqueda para encontrar otras." : `${count} ${count === 1 ? "coincidencia" : "coincidencias"}`}</p>{count ? <ul>{children}</ul> : <p className="empty">Sin coincidencias en esta sección.</p>}</section>;
}
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q, error, results } = await searchCrm((await searchParams).q);
  return <CrmShell active="/buscar"><header className="topbar"><div><p className="eyebrow">Consulta interna</p><h1>Buscar en el CRM</h1><p className="topbar-copy">Nombres, teléfonos, números de venta, productos, SKU y tareas. Las conversaciones se encuentran por los datos del cliente, no por el contenido del chat.</p></div></header>
    <form key={q} action="/buscar" className="table-search"><label htmlFor="search-query">Buscar</label><input id="search-query" name="q" defaultValue={q} maxLength={120} placeholder="Nombre, teléfono, producto o #venta" /><button className="button">Buscar</button><Link href="/buscar">Limpiar</Link></form>
    {error && <p role="alert">{error}</p>}
    {!results && !error && <section className="panel"><h2>¿Qué querés encontrar?</h2><p>Ingresá un dato para consultar el CRM. No se consulta Botpress ni se modifican registros al buscar.</p></section>}
    {results && <div className="dashboard-grid">
      <Results title="Clientes" count={results.customers.length}>{results.customers.slice(0,10).map(c => <li key={c.id}><Link href={`/clientes/${c.id}`}>{c.fullName || c.whatsappProfileName || "Contacto sin nombre"}</Link><span>{crmPhone(c.phone) || "Teléfono por identificar"} · {crmStatus(c.funnelStage)}</span></li>)}</Results>
      <Results title="Pedidos" count={results.orders.length}>{results.orders.slice(0,10).map(o => <li key={o.id}><Link href={`/pedidos/${o.id}`}>Venta #{o.saleNumber} · {o.recipientName || "Sin receptor"}</Link><span>{crmDate(o.saleDate)} · {orderStatusLabel(o.status, o.deliveryMethod)} · {crmStatus(o.deliveryMethod)}</span></li>)}</Results>
      <Results title="Productos" count={results.products.length}>{results.products.slice(0,10).map(p => <li key={p.id}><Link href={`/productos/${p.id}`}>{p.name}</Link><span>{p.sku} · {p.category || "Sin categoría"} · {p.isActive ? "Activo" : "Inactivo"}</span></li>)}</Results>
      <Results title="Tareas" count={results.tasks.length}>{results.tasks.slice(0,10).map(t => <li key={t.id}><Link href={`/tareas#task-${t.id}`}>{t.title}</Link><span>{crmStatus(t.status)} · {t.dueAt ? `Vence ${crmDate(t.dueAt, true)}` : "Sin vencimiento"}{t.orderId ? " · Vinculada a un pedido" : t.customerId ? " · Vinculada a un cliente" : ""}</span></li>)}</Results>
      <Results title="Conversaciones" count={results.conversations.length}>{results.conversations.slice(0,10).map(c => <li key={c.id}><Link href={`/bandeja?conversation=${c.id}`}>{c.customer.fullName || c.customer.whatsappProfileName || "Contacto sin nombre"}</Link><span>{crmPhone(c.customer.phone) || "Teléfono por identificar"} · {crmStatus(c.status)} · {c.channel === "whatsapp" ? "WhatsApp" : "Otro canal"}</span></li>)}</Results>
    </div>}
  </CrmShell>;
}
