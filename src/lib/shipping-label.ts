export type LabelOrder = {
  saleNumber: number; status: string; deliveryMethod: string;
  recipientName: string; recipientPhone: string | null; deliveryAddress: string;
  locality: string; postalCode: string | null; deliveryDate: Date | null;
  deliveryTimeWindow: string | null; assignedCourier: string | null;
  paymentMethod: string; currency: string; shippingCents: number; totalCents: number;
  items: { quantity: number; unitPriceCents: number; product: { name: string; sku: string } }[];
};

export function labelEligibility(order: Partial<LabelOrder>) {
  const missing: string[] = [];
  if (order.deliveryMethod !== "COURIER") missing.push("la modalidad debe ser mensajería");
  if (!order.status || !["APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status)) missing.push("el pedido debe estar aprobado para logística");
  if (!order.recipientName?.trim()) missing.push("receptor");
  if (!order.recipientPhone?.trim()) missing.push("teléfono");
  if (!order.deliveryAddress?.trim()) missing.push("dirección");
  if (!order.locality?.trim()) missing.push("localidad");
  if (!order.deliveryDate) missing.push("fecha programada");
  if (!order.items?.length || order.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || !item.product?.name?.trim() || !item.product?.sku?.trim())) missing.push("producto, SKU o cantidad");
  return { ready: missing.length === 0, missing };
}

export function canLabel(order: Partial<LabelOrder>) {
  return labelEligibility(order).ready;
}

// Encode every UTF-8 byte: customer text can never become a ZPL command.
export function zplText(value: string) {
  return Array.from(Buffer.from(value, "utf8"), byte => `_${byte.toString(16).padStart(2, "0")}`).join("");
}

function lines(value: string, width: number, max: number): string[] {
  const words = value.trim().split(/\s+/);
  const result: string[] = [];
  for (const word of words) {
    if (word.length > width) throw new Error("Hay un dato demasiado largo para la etiqueta. Revisá la dirección y los datos de entrega.");
    if (result.length && result[result.length - 1].length + word.length + 1 <= width) result[result.length - 1] += ` ${word}`;
    else result.push(word);
  }
  if (result.length > max) throw new Error("Los datos de entrega exceden el espacio de la etiqueta. Revisalos antes de imprimir.");
  return result;
}

export function shippingLabel(order: LabelOrder) {
  const eligibility = labelEligibility(order);
  if (!eligibility.ready) throw new Error(`Venta #${order.saleNumber}: faltan o requieren revisión ${eligibility.missing.join(", ")}.`);
  if (order.paymentMethod !== "CASH_OR_TRANSFER" || order.currency !== "ARS") throw new Error("Revisá la modalidad de cobro antes de generar una etiqueta contraentrega.");
  const validCents = (value: number) => Number.isSafeInteger(value) && value >= 0;
  if (!order.items.length || !validCents(order.shippingCents) || !validCents(order.totalCents) || order.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !validCents(item.unitPriceCents) || !item.product.name.trim())) throw new Error("El pedido tiene productos o importes inválidos.");
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  if (!validCents(subtotal) || subtotal + order.shippingCents !== order.totalCents) throw new Error("Los productos y el envío no coinciden con el total del pedido. Revisalo antes de cobrar.");
  const money = (cents: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
  const fields: string[] = [];
  const text = (x: number, y: number, value: string, size = 28, width = 48, max = 1, align: "L" | "C" | "R" = "L", fieldWidth = 800 - x - 32) => {
    lines(value, width, max).forEach((line, index) => fields.push(`^FO${x},${y + index * (size + 7)}^A0N,${size},${Math.round(size * .72)}^FH_^FB${fieldWidth},1,0,${align}^FD${zplText(line)}^FS`));
  };
  fields.push(`^FO32,20${ADARA_LABEL_LOGO_ZPL}`);
  text(440, 48, `VENTA #${order.saleNumber}`, 34, 22, 1, "R", 328);
  text(0, 125, "ENTREGA A DOMICILIO", 34, 40, 1, "C", 400);
  const date = order.deliveryDate ? new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }).format(order.deliveryDate) : "A coordinar";
  text(420, 125, date, 30, 20, 1, "C", 380);
  text(0, 195, `CP: ${order.postalCode || "No informado"}`, 46, 22, 1, "C", 800);
  text(0, 250, order.locality, 38, 32, 2, "C", 800);
  text(32, 340, "DESTINATARIO", 19);
  text(32, 367, order.recipientName, 30, 45, 2);
  text(32, 442, "DIRECCION", 19);
  text(32, 469, order.deliveryAddress, 28, 48, 3);
  text(32, 575, `Tel: ${order.recipientPhone || "No informado"}  |  Franja: ${order.deliveryTimeWindow || "A coordinar"}`, 20, 64, 2);
  text(32, 652, "PRODUCTOS PARA ARMAR", 22);
  const productLines = order.items.flatMap(item => lines(`${item.quantity} x ${item.product.name} | SKU: ${item.product.sku} | c/u ${money(item.unitPriceCents)}`, 60, 4));
  if (productLines.length > 4) throw new Error("El detalle de productos no entra en una etiqueta de 10 x 15 cm. Requiere una hoja de armado adicional.");
  productLines.forEach((line, index) => text(32, 687 + index * 29, line, 21, 64));
  text(32, 820, `Productos: ${money(subtotal)}`, 25);
  text(32, 857, `Envio: ${money(order.shippingCents)}`, 25);
  text(32, 898, `TOTAL A COBRAR: ${money(order.totalCents)}`, 36, 36);
  text(32, 950, "CONTRAENTREGA - Efectivo o transferencia al cadete", 20, 66);
  text(0, 1140, "Etiqueta interna ADARA", 18, 60, 1, "C", 800);
  return `^XA\n^CI28\n^PW800\n^LL1200\n^LH0,0\n^LS0\n^LT0\n${fields.join("\n")}\n^FO0,105^GB800,2,2^FS\n^FO0,180^GB800,2,2^FS\n^FO400,105^GB2,75,2^FS\n^FO0,320^GB800,2,2^FS\n^FO0,625^GB800,2,2^FS\n^FO0,800^GB800,2,2^FS\n^FO32,1015^BY2^BCN,65,N,N,N^FD${order.saleNumber}^FS\n^PQ1\n^XZ\n`;
}
import { ADARA_LABEL_LOGO_ZPL } from "./adara-label-logo";
