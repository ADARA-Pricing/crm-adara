import { updateOrderStatus } from "@/app/pedidos/actions";

const nextActions: Record<string, { status: string; label: string; tone?: "danger" }[]> = {
  PENDING_REVIEW: [{ status: "APPROVED_FOR_LOGISTICS", label: "Aprobar" }, { status: "CANCELLED", label: "Cancelar", tone: "danger" }],
  APPROVED_FOR_LOGISTICS: [{ status: "PREPARING", label: "Preparar" }],
  PREPARING: [{ status: "SHIPPED", label: "Despachar" }],
  SHIPPED: [{ status: "DELIVERED", label: "Entregado" }]
};

export function OrderStatusActions({ id, status }: { id: string; status: string }) {
  const actions = nextActions[status] ?? [];
  if (!actions.length) return <span className="muted">Sin acciones</span>;
  return <div className="order-row-actions">{actions.map((action) => <form action={updateOrderStatus.bind(null, id, action.status)} key={action.status}><button className={action.tone === "danger" ? "danger-text" : ""} type="submit">{action.label}</button></form>)}</div>;
}
