import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stages = [
  ["FIRST_CONTACT", "Primer contacto", "Escribió por primera vez."],
  ["INTERESTED", "Interesado", "Manifestó interés en un producto."],
  ["VERY_INTERESTED", "Muy interesado", "Consulta precio, condiciones o quiere avanzar."],
  ["COORDINATE_DELIVERY", "Coordinar envío", "Eligió mensajería y se están tomando los datos."],
  ["LOCAL_PICKUP", "Retira por el local", "Eligió retirar en Av. Cramer."],
  ["COMPLETED", "Finalizado", "Entrega o retiro efectivamente completado."],
  ["ABANDONED", "Abandonado", "No siguió o declinó la compra."],
] as const;

export default async function FunnelPage() {
  const customers = await prisma.customer.findMany({ orderBy: [{ lastMessageAt: "desc" }, { funnelUpdatedAt: "desc" }], take: 100, include: { _count: { select: { orders: true } } } });
  return <CrmShell active="/embudo"><header className="topbar"><div><p className="eyebrow">Seguimiento comercial</p><h1>Embudo de ventas</h1><p className="topbar-copy">Cada persona avanza por comportamiento real; el pedido y la entrega se gestionan por separado.</p></div></header>
    <section className="funnel-board">{stages.map(([stage, title, description]) => { const people = customers.filter((customer) => customer.funnelStage === stage); return <article key={stage} className="funnel-column"><div className="funnel-column-head"><div><h2>{title}</h2><p>{description}</p></div><span>{people.length}</span></div><div className="funnel-cards">{people.map((customer) => <div className="funnel-person" key={customer.id}><strong>{customer.fullName || "Contacto sin nombre"}</strong><span>{customer.phone || "WhatsApp por identificar"}</span>{customer.locality ? <small>{customer.locality}{customer.postalCode ? ` · CP ${customer.postalCode}` : ""}</small> : null}{customer.deliveryPreference ? <small>{customer.deliveryPreference === "PICKUP" ? "Retiro en local" : "Mensajería privada"}</small> : null}{customer.deliveryAddress ? <small className="private-detail">{customer.deliveryAddress}</small> : null}{customer.lastMessagePreview ? <small className="message-preview">“{customer.lastMessagePreview}”</small> : null}{customer.funnelNote ? <small>{customer.funnelNote}</small> : null}<footer>{customer._count.orders ? `${customer._count.orders} pedido(s)` : "Sin pedido"}<time>{(customer.lastMessageAt || customer.funnelUpdatedAt).toLocaleDateString("es-AR")}</time></footer></div>)}{!people.length ? <div className="funnel-empty">Sin contactos</div> : null}</div></article>; })}</section>
  </CrmShell>;
}
