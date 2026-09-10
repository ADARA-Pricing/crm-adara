export const funnelStages = [
  ["FIRST_CONTACT", "Primer contacto", "Escribió por primera vez."],
  ["INTERESTED", "Interesado", "Manifestó interés en un producto."],
  ["VERY_INTERESTED", "Muy interesado", "Consulta precio, condiciones o quiere avanzar."],
  ["COORDINATE_DELIVERY", "Coordinar envío", "Eligió mensajería y se están tomando los datos."],
  ["LOCAL_PICKUP", "Retiro en local", "Eligió retirar por Av. Cramer 2548."],
  ["COMPLETED", "Finalizado", "Operación efectivamente completada."],
  ["ABANDONED", "Abandonado", "No siguió o declinó la compra."],
] as const;
export type FunnelStage = typeof funnelStages[number][0];
