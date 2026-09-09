import type { Prisma } from "@prisma/client";
export function searchTerm(raw: unknown) {
  if (typeof raw !== "string") return { q: "", error: "" };
  const q = raw.trim();
  if (q.length > 120) return { q: q.slice(0, 120), error: "La búsqueda admite hasta 120 caracteres." };
  return { q, error: q && q.length < 2 && !/^#?\d+$/.test(q) ? "Escribí al menos dos caracteres, o un número de venta." : "" };
}
export function globalSearchFilters(q: string) {
  const phone = /^\+?[\d\s().-]+$/.test(q) ? q.replace(/\D/g, "") : "";
  const text = (value: string) => ({ contains: value, mode: "insensitive" as const });
  const customer: Prisma.CustomerWhereInput = { archivedAt: null, OR: [{ fullName: text(q) }, { whatsappProfileName: text(q) }, { phone: { contains: phone || q } }, { locality: text(q) }] };
  const number = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
  const order: Prisma.OrderWhereInput = { OR: [{ recipientName: text(q) }, { recipientPhone: { contains: phone || q } }, { customer }, ...(number !== null && number <= 2147483647 ? [{ saleNumber: number }] : [])] };
  const product: Prisma.ProductWhereInput = { OR: [{ name: text(q) }, { sku: text(q) }, { category: text(q) }] };
  const conversation: Prisma.ConversationWhereInput = { customer };
  const task: Prisma.TaskWhereInput = { OR: [{ title: text(q) }, { description: text(q) }, { customer }, { order: { OR: [{ recipientName: text(q) }, ...(number !== null && number <= 2147483647 ? [{ saleNumber: number }] : [])] } }] };
  return { customer, order, product, conversation, task };
}
