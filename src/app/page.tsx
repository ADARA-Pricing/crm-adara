import { formatArs, getHumanSupportSchedule, getPickupSchedule, LOCAL_ADDRESS, PRODUCT } from "@/lib/sales-policy";
import { prisma } from "@/lib/prisma";
import { CrmShell } from "@/components/crm-shell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pendingOrders = await prisma.order.count({ where: { status: "PENDING_REVIEW" } });
  const cards = [
    ["Pedidos para revisar", String(pendingOrders), "Confirmados por el cliente y pendientes de validación."],
    ["Entrega Flex", formatArs(700_000), "Costo fijo para este canal."],
    ["Atención humana", getHumanSupportSchedule(), "Derivación desde el bot."],
    ["Retiro en local", LOCAL_ADDRESS, getPickupSchedule()]
  ];

  return <CrmShell active="/">
    <header className="topbar"><div><p className="eyebrow">Vista de operación</p><h1>Lo que necesita atención hoy</h1><p className="topbar-copy">Ventas por WhatsApp, validación y coordinación de entregas.</p></div></header>
      <section className="metric-grid">
        {cards.map(([title, value, detail]) => (
          <article key={title} className="metric">
            <span className="metric-label">{title}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span>
          </article>
        ))}
      </section>
      <div className="section-heading"><h2>Flujo operativo</h2></div>
      <section className="operations-grid"><article className="panel"><h3>Pedidos: un embudo operativo, no de marketing</h3><p>El pedido entra solo cuando el cliente ya confirmó los datos y el total. Así logística recibe información accionable.</p><div className="flow"><span className="flow-step">En conversación</span><span className="flow-arrow">→</span><span className="flow-step">Confirmado · revisar</span><span className="flow-arrow">→</span><span className="flow-step">Logística</span><span className="flow-arrow">→</span><span className="flow-step">Entregado</span></div></article><article className="panel"><h3>Reglas activas</h3><div className="policy-list"><div>Cada pedido confirmado pasa por revisión interna.<span>Protege a Adara antes de asignarlo a logística.</span></div><div>El bot no promete disponibilidad sin validación.<span>Stock y zonas quedan bajo control operativo.</span></div></div></article></section>
  </CrmShell>;
}
