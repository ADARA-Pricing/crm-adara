export const PRODUCT = {
  sku: "INFINIX-SMART-10-NEGRO",
  name: "Infinix Smart 10 negro",
  priceCents: 19_999_900,
  warrantyMonths: 12
} as const;

export const FLEX_SHIPPING_CENTS = 700_000;
export const LOCAL_CARD_SURCHARGE_RATE = 0.07;
export const LOCAL_ADDRESS = "Av. Cramer 2548, CABA";

const flexLocalities = [
  "caba", "ciudad autonoma de buenos aires", "buenos aires",
  "vicente lopez", "san martin", "tres de febrero", "hurlingham", "ituzaingo",
  "moron", "la matanza", "merlo", "lanus", "avellaneda", "quilmes", "berazategui",
  "florencio varela", "lomas de zamora", "almirante brown", "esteban echeverria",
  "ezeiza", "tristan suarez", "virrey del pino", "tigre", "san fernando",
  "malvinas argentinas", "jose c paz", "san miguel", "moreno"
];

export type DeliveryMethod = "FLEX" | "PICKUP";
export type PaymentMethod = "CASH_OR_TRANSFER" | "CARD_ONE_PAYMENT";

export function normalizeLocation(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isFlexLocation(location: string) {
  const normalized = normalizeLocation(location);
  return flexLocalities.some((locality) => normalized.includes(locality));
}

export function getPrice(deliveryMethod: DeliveryMethod, paymentMethod: PaymentMethod) {
  if (deliveryMethod === "FLEX") {
    return {
      productCents: PRODUCT.priceCents,
      shippingCents: FLEX_SHIPPING_CENTS,
      totalCents: PRODUCT.priceCents + FLEX_SHIPPING_CENTS
    };
  }

  const totalCents = paymentMethod === "CARD_ONE_PAYMENT"
    ? Math.round((PRODUCT.priceCents * (1 + LOCAL_CARD_SURCHARGE_RATE)) / 100) * 100
    : PRODUCT.priceCents;

  return { productCents: PRODUCT.priceCents, shippingCents: 0, totalCents };
}

export function formatArs(cents: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function getPickupSchedule() {
  return "Lunes a viernes de 10 a 19 h; sábados de 11 a 15 h.";
}

export function getHumanSupportSchedule() {
  return "Lunes a viernes de 10 a 18 h.";
}
