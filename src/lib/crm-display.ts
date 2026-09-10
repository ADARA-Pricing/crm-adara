/** Presentation only. Never imported by bot contracts or write actions. */
export const CRM_TIME_ZONE = "America/Argentina/Buenos_Aires";
const labels: Record<string, string> = {
  PENDING_REVIEW: "Para revisar", APPROVED: "Aprobado", APPROVED_FOR_LOGISTICS: "Aprobado para logística",
  PREPARING: "En preparación", ASSIGNED: "Asignado", SHIPPED: "En reparto", DELIVERED: "Entregado",
  READY_FOR_PICKUP: "Listo para retirar", CANCELLED: "Cancelado", DRAFT: "Borrador",
  AWAITING_CUSTOMER_CONFIRMATION: "Esperando confirmación", FIRST_CONTACT: "Primer contacto",
  INTERESTED: "Interesado", VERY_INTERESTED: "Muy interesado", COORDINATE_DELIVERY: "Coordinar envío",
  COORDINATING_DELIVERY: "Coordinar envío", LOCAL_PICKUP: "Retiro en local", STORE_PICKUP: "Retiro en local",
  COMPLETED: "Finalizado", FINISHED: "Finalizado", ABANDONED: "Abandonado", LEAD: "Contacto",
  ACTIVE: "Activo", INACTIVE: "Inactivo", OPEN: "Abierto", CLOSED: "Cerrado", HUMAN_HANDOFF: "Atención humana",
  IN_PROGRESS: "En curso", DONE: "Completada", FOLLOW_UP: "Seguimiento", DELIVERY_CONFIRMATION: "Confirmar entrega", ORDER_REVIEW: "Revisar pedido", LOGISTICS: "Logística", CALL: "Llamada",
  DELIVERY: "Entrega", OTHER: "Otro", PICKUP: "Retiro en local", COURIER: "Envío por mensajería",
  CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta", WEB: "Compra web",
  ACCEPTED: "Aceptado para envío", UNCERTAIN: "Envío por verificar", SENDING: "Enviando",
  TASK_CREATED: "Tarea creada", DISCARDED: "Descartado", MESSAGE_DRAFT: "Borrador de mensaje", TASK: "Tarea",
};
export function crmStatus(value: string | null | undefined) { return value ? labels[value] ?? "Estado por verificar" : "A coordinar"; }
export function crmDate(value: Date | string | null | undefined, withTime = false) {
  if (!value) return "Sin fecha";
  // Native date inputs use calendar-only values. Treating them as UTC shifts the
  // visible day back in Argentina, so display their literal calendar date.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha por verificar";
  return new Intl.DateTimeFormat("es-AR", { timeZone: CRM_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}) }).format(date);
}
export function crmPhone(value: string | null | undefined) {
  if (!value || !/^\+?[\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? `${value.trim().startsWith("+") ? "+" : ""}${digits}` : null;
}
export function argentinaDayStart(now = new Date()) {
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return new Date(`${local.toISOString().slice(0, 10)}T00:00:00-03:00`);
}
