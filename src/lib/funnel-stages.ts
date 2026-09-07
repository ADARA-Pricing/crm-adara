export const funnelStages = [
  ["FIRST_CONTACT", "Primer contacto", "Escribió por primera vez."],
  ["INTERESTED", "Interesado", "Manifestó interés en un producto."],
  ["VERY_INTERESTED", "Muy interesado", "Consulta precio, condiciones o quiere avanzar."],
  ["COORDINATE_DELIVERY", "Coordinar envío", "Eligió mensajería y se están tomando los datos."],
  ["LOCAL_PICKUP", "Retira por el local", "Eligió retirar en Av. Cramer."],
  ["COMPLETED", "Finalizado", "Entrega o retiro efectivamente completado."],
  ["ABANDONED", "Abandonado", "No siguió o declinó la compra."],
] as const;
export type FunnelStage = typeof funnelStages[number][0];
