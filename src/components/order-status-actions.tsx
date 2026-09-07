import { updateOrderStatus } from "@/app/pedidos/actions";
import Link from "next/link";

const nextActions: Record<string, { status: string; label: string; tone?: "danger" }[]> = {
  PENDING_REVIEW: [{ status: "CANCELLED", label: "Cancelar", tone: "danger" }],
  APPROVED_FOR_LOGISTICS: [{ status: "PREPARING", label: "Preparar" }],
  PREPARING: [{ status: "SHIPPED", label: "Despachar" }],
  SHIPPED: [{ status: "DELIVERED", label: "Entregado" }]
};

export function OrderStatusActions({ id, status }: { id: string; status: string }) {
  const actions = nextActions[status] ?? [];
  if (!actions.length) return <span className="muted">Sin acciones</span>;
  return <div className="order-row-actions">{status === "PENDING_REVIEW" ? <Link href={`/pedidos/${id}/revisar`}>Revisar pedido</Link> : null}{actions.map((action) => <form action={updateOrderStatus.bind(null, id, action.status)} key={action.status}><button className={action.tone === "danger" ? "danger-text" : ""} type="submit">{action.label}</button></form>)}</div>;
}
