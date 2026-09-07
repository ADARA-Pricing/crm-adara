import { orderStatusLabel } from "@/lib/order-status";
import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs } from "@/lib/sales-policy";
import { OrderStatusActions } from "@/components/order-status-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { customer: true, items: { include: { product: true } } } });
  const labels: Record<string, string> = { PENDING_REVIEW: "Para revisar", APPROVED_FOR_LOGISTICS: "Logística", PREPARING: "Preparando", SHIPPED: "En reparto", DELIVERED: "Entregado", CANCELLED: "Cancelado", DRAFT: "Borrador", AWAITING_CUSTOMER_CONFIRMATION: "Esperando confirmación" };
  return <CrmShell active="/pedidos"><header className="topbar"><div><p className="eyebrow">Ventas</p><h1>Pedidos</h1><p className="topbar-copy">Cada confirmación entra a revisión antes de pasar a logística.</p></div></header>
    <section className="table-wrap"><table><thead><tr><th>Venta</th><th>Cliente</th><th>Producto</th><th>Entrega</th><th>Total</th><th>Estado</th><th>Fecha de venta</th><th>Acción</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="primary-cell"><Link className="table-primary-link" href={`/pedidos/${order.id}`}>#{order.saleNumber}</Link></td><td>{order.recipientName || order.customer.fullName || "Sin nombre"}</td><td>{order.items.map((item) => item.product.name).join(", ") || "—"}</td><td>{order.deliveryMethod === "PICKUP" ? "Retiro en local" : `${order.locality} · Mensajería`}</td><td>{formatArs(order.totalCents)}</td><td><span className={`badge ${order.status === "PENDING_REVIEW" ? "warning" : "neutral"}`}>{orderStatusLabel(order.status, order.deliveryMethod)}</span></td><td className="muted">{order.saleDate.toLocaleDateString("es-AR")}</td><td><OrderStatusActions id={order.id} status={order.status} deliveryMethod={order.deliveryMethod} /></td></tr>)}</tbody></table>{orders.length === 0 ? <div className="empty">Aún no hay pedidos confirmados. Cuando el bot reciba una confirmación explícita, aparecerán acá para revisión.</div> : null}</section>
  </CrmShell>;
}
