import Link from "next/link";
import { notFound } from "next/navigation";
import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs, LOCAL_ADDRESS } from "@/lib/sales-policy";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = { FIRST_CONTACT: "Primer contacto", INTERESTED: "Interesado", VERY_INTERESTED: "Muy interesado", COORDINATE_DELIVERY: "Coordinar envío", LOCAL_PICKUP: "Retiro en local", COMPLETED: "Finalizado", ABANDONED: "Abandonado" };
const orderLabels: Record<string, string> = { PENDING_REVIEW: "Para revisar", APPROVED_FOR_LOGISTICS: "Logística", PREPARING: "Preparando", SHIPPED: "En reparto", DELIVERED: "Entregado", CANCELLED: "Cancelado", DRAFT: "Borrador", AWAITING_CUSTOMER_CONFIRMATION: "Esperando confirmación" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id }, include: { conversations: { orderBy: { updatedAt: "desc" }, include: { _count: { select: { events: true } } } }, orders: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } }, activities: { orderBy: { createdAt: "desc" }, take: 5 } } } } });
  if (!customer) notFound();
  const hasPickup = customer.deliveryPreference === "PICKUP";
  return <CrmShell active="/clientes"><header className="topbar"><div><p className="eyebrow">Ficha de cliente</p><h1>{customer.fullName || customer.whatsappProfileName || "Contacto sin nombre"}</h1><p className="topbar-copy">Información unificada de atención, compra y entrega.</p></div><div className="topbar-actions"><Link className="button secondary" href="/clientes">Volver a clientes</Link>{customer.conversations[0] ? <Link className="button" href={`/bandeja?conversation=${customer.conversations[0].id}`}>Ver conversación</Link> : null}</div></header>
    <section className="customer-detail-grid"><article className="panel detail-panel"><h2>Contacto</h2><dl className="detail-list"><div><dt>Teléfono</dt><dd>{customer.phone ?? "Pendiente de identificar"}</dd></div><div><dt>WhatsApp</dt><dd>{customer.whatsappId ?? "Pendiente"}</dd></div><div><dt>Estado comercial</dt><dd><span className="badge neutral">{stageLabels[customer.funnelStage]}</span></dd></div><div><dt>Último contacto</dt><dd>{(customer.lastMessageAt ?? customer.updatedAt).toLocaleString("es-AR")}</dd></div></dl>{customer.lastMessagePreview ? <div className="context-note"><small>Último mensaje</small><p>{customer.lastMessagePreview}</p></div> : null}{customer.notes ? <div className="context-note"><small>Notas internas</small><p>{customer.notes}</p></div> : null}</article>
      <article className="panel detail-panel"><h2>Entrega preferida</h2><dl className="detail-list"><div><dt>Modalidad</dt><dd>{hasPickup ? "Retiro en local" : customer.deliveryPreference === "COURIER" ? "Mensajería privada" : "Sin definir"}</dd></div><div><dt>Destino</dt><dd>{hasPickup ? LOCAL_ADDRESS : customer.deliveryAddress ?? "Pendiente"}</dd></div><div><dt>Localidad / CP</dt><dd>{[customer.locality, customer.postalCode].filter(Boolean).join(" · ") || "Pendiente"}</dd></div><div><dt>Fecha deseada</dt><dd>{customer.requestedDate?.toLocaleDateString("es-AR") ?? "A coordinar"}</dd></div></dl>{customer.funnelNote ? <div className="context-note"><small>Nota comercial</small><p>{customer.funnelNote}</p></div> : null}</article></section>
    <section className="section-heading"><h2>Pedidos</h2><Link href="/pedidos">Ir a pedidos</Link></section><section className="panel detail-panel">{customer.orders.length ? <div className="history-list">{customer.orders.map((order) => <article key={order.id}><header><div><strong>{order.items.map((item) => item.product.name).join(", ") || "Pedido"}</strong><small>{order.createdAt.toLocaleString("es-AR")}</small></div><div><b>{formatArs(order.totalCents)}</b><span className="badge neutral">{orderLabels[order.status]}</span></div></header><p>{order.deliveryMethod === "PICKUP" ? "Retiro en Av. Cramer" : `${order.deliveryAddress}, ${order.locality}`}</p>{order.activities.length ? <footer>{order.activities.map((activity) => <span key={activity.id}>{activity.detail}</span>)}</footer> : null}</article>)}</div> : <div className="empty">Este contacto todavía no tiene pedidos.</div>}</section>
  </CrmShell>;
}
