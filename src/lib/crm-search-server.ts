import "server-only";
import { requireCrmUser } from "./auth";
import { prisma } from "./prisma";
import { globalSearchFilters, searchTerm } from "./crm-search";
/** Local CRM search only. No Botpress calls, writes, or shared result cache. */
export async function searchCrm(raw: unknown) {
  await requireCrmUser();
  const { q, error } = searchTerm(raw);
  if (!q || error) return { q, error, results: null };
  const filter = globalSearchFilters(q);
  const [customers, orders, products, conversations] = await Promise.all([
    prisma.customer.findMany({ where: filter.customer, take: 11, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], select: { id: true, fullName: true, whatsappProfileName: true, phone: true, funnelStage: true } }),
    prisma.order.findMany({ where: filter.order, take: 11, orderBy: [{ saleDate: "desc" }, { id: "asc" }], select: { id: true, saleNumber: true, recipientName: true, status: true, deliveryMethod: true, saleDate: true } }),
    prisma.product.findMany({ where: filter.product, take: 11, orderBy: [{ name: "asc" }, { id: "asc" }], select: { id: true, name: true, sku: true, category: true, isActive: true } }),
    prisma.conversation.findMany({ where: filter.conversation, take: 11, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], select: { id: true, channel: true, status: true, customer: { select: { fullName: true, whatsappProfileName: true, phone: true } } } })
  ]);
  return { q, error, results: { customers, orders, products, conversations } };
}
