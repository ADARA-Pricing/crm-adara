export function orderStatusLabel(status: string, method: string) {
  if (status === "DELIVERED") return method === "PICKUP" ? "Retirado" : "Entregado";
  if (status === "SHIPPED" && method === "PICKUP") return "Retiro pendiente de regularizar";
  const labels: Record<string, string> = { DRAFT: "Borrador", AWAITING_CUSTOMER_CONFIRMATION: "Esperando confirmación", PENDING_REVIEW: "Para revisar", APPROVED_FOR_LOGISTICS: "Aprobado para logística", PREPARING: "En preparación", SHIPPED: "En reparto", READY_FOR_PICKUP: "Listo para retirar", CANCELLED: "Cancelado" };
  return labels[status] || status;
}

export function orderActions(status: string, method: string): { status: string; label: string }[] {
  if (status === "PENDING_REVIEW") return [{ status: "CANCELLED", label: "Cancelar" }];
  if (status === "APPROVED_FOR_LOGISTICS") return [{ status: "PREPARING", label: "Preparar" }];
  if (method === "PICKUP") {
    if (status === "PREPARING" || status === "SHIPPED") return [{ status: "READY_FOR_PICKUP", label: "Listo para retirar" }];
    if (status === "READY_FOR_PICKUP") return [{ status: "DELIVERED", label: "Confirmar retiro" }];
  }
  if (method === "COURIER") {
    if (status === "PREPARING") return [{ status: "SHIPPED", label: "Despachar" }];
    if (status === "SHIPPED") return [{ status: "DELIVERED", label: "Confirmar entrega" }];
  }
  return [];
}
