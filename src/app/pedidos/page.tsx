import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs } from "@/lib/sales-policy";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { customer: true, items: { include: { product: true } } } });
  const labels: Record<string, string> = { PENDING_REVIEW: "Para revisar", APPROVED_FOR_LOGISTICS: "Logística", PREPARING: "Preparando", SHIPPED: "En reparto", DELIVERED: "Entregado", CANCELLED: "Cancelado", DRAFT: "Borrador", AWAITING_CUSTOMER_CONFIRMATION: "Esperando confirmación" };
  return <CrmShell active="/pedidos"><header className="topbar"><div><p className="eyebrow">Operación</p><h1>Pedidos</h1><p className="topbar-copy">El tablero de trabajo del equipo: confirmar, revisar y entregar.</p></div><button className="button">+ Cargar pedido</button></header>
    <section className="table-wrap"><table><thead><tr><th>Cliente</th><th>Producto</th><th>Entrega</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="primary-cell">{order.recipientName || order.customer.fullName || "Sin nombre"}</td><td>{order.items.map((item) => item.product.name).join(", ") || "—"}</td><td>{order.deliveryMethod === "PICKUP" ? "Retiro en local" : `${order.locality} · Flex`}</td><td>{formatArs(order.totalCents)}</td><td><span className={`badge ${order.status === "PENDING_REVIEW" ? "warning" : "neutral"}`}>{labels[order.status]}</span></td><td className="muted">{order.createdAt.toLocaleDateString("es-AR")}</td></tr>)}</tbody></table>{orders.length === 0 ? <div className="empty">Aún no hay pedidos confirmados. Cuando el bot reciba una confirmación explícita, aparecerán acá para revisión.</div> : null}</section>
  </CrmShell>;
}
