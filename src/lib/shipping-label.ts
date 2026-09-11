export type LabelOrder = {
  saleNumber: number; status: string; deliveryMethod: string;
  recipientName: string; recipientPhone: string | null; deliveryAddress: string;
  locality: string; postalCode: string | null; deliveryDate: Date | null;
  deliveryTimeWindow: string | null; assignedCourier: string | null;
  paymentMethod: string; currency: string; shippingCents: number; totalCents: number;
  items: { quantity: number; unitPriceCents: number; product: { name: string; sku: string } }[];
  customer?: { phone: string | null };
};

export function labelEligibility(order: Partial<LabelOrder>) {
  const missing: string[] = [];
  const recipientPhone = order.recipientPhone || order.customer?.phone;
  if (order.deliveryMethod !== "COURIER") missing.push("la modalidad debe ser mensajería");
  if (!order.status || !["APPROVED_FOR_LOGISTICS", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status)) missing.push("el pedido debe estar aprobado para logística");
  if (!order.recipientName?.trim()) missing.push("receptor");
  if (!recipientPhone?.trim()) missing.push("teléfono");
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
  const recipientPhone = order.recipientPhone || order.customer?.phone;
  const eligibility = labelEligibility({ ...order, recipientPhone });
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
  text(450, 38, `VENTA #${order.saleNumber}`, 34, 22, 1, "R", 318);
  text(32, 112, "ENTREGA A DOMICILIO", 34, 32, 1);
  const date = order.deliveryDate ? new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }).format(order.deliveryDate) : "A coordinar";
  text(490, 112, date, 32, 18, 1, "R", 278);
  text(32, 180, "DIRECCION", 21);
  text(32, 210, order.deliveryAddress, 48, 27, 2, "L", 736);
  text(32, 332, `${order.locality} · CP ${order.postalCode || "A CONFIRMAR"}`, 42, 34, 2, "C", 736);
  text(32, 440, "RECIBE", 21);
  text(32, 470, order.recipientName, 42, 32, 2, "L", 736);
  text(32, 575, `TELÉFONO: ${recipientPhone || "No informado"}`, 34, 34, 1);
  text(32, 625, `FRANJA: ${order.deliveryTimeWindow || "A coordinar"}`, 28, 45, 1);
  text(32, 695, "PRODUCTO A PREPARAR", 21);
  const productLines = order.items.flatMap(item => lines(`${item.quantity} x ${item.product.name} · SKU ${item.product.sku}`, 42, 3));
  if (productLines.length > 3) throw new Error("El detalle de productos no entra en una etiqueta de 10 x 15 cm. Requiere una hoja de armado adicional.");
  productLines.forEach((line, index) => text(32, 725 + index * 37, line, 29, 46));
  const totalsY = 850;
  text(32, totalsY, `Producto: ${money(subtotal)} · Envío: ${money(order.shippingCents)}`, 24, 58);
  text(32, totalsY + 43, "TOTAL A COBRAR", 26);
  text(32, totalsY + 76, money(order.totalCents), 62, 18, 1, "L", 736);
  text(32, 1050, "CONTRAENTREGA · efectivo o transferencia al cadete", 24, 55);
  text(0, 1150, "ADARA · etiqueta operativa", 18, 60, 1, "C", 800);
  return `^XA\n^CI28\n^PW800\n^LL1200\n^LH0,0\n^LS0\n^LT0\n${fields.join("\n")}\n^FO0,92^GB800,2,2^FS\n^FO0,160^GB800,2,2^FS\n^FO0,408^GB800,2,2^FS\n^FO0,675^GB800,2,2^FS\n^FO0,825^GB800,2,2^FS\n^FO0,1030^GB800,2,2^FS\n^PQ1\n^XZ\n`;
}
import { ADARA_LABEL_LOGO_ZPL } from "./adara-label-logo";
