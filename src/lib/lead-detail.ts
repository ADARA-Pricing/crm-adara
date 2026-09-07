import "server-only";
import { prisma } from "@/lib/prisma";

export async function readLeadDetail(id: string) {
  const [customer, members] = await Promise.all([
    prisma.customer.findUnique({ where: { id }, include: {
      conversations: { orderBy: { updatedAt: "desc" }, include: { messageCache: true } },
      orders: { orderBy: { saleDate: "desc" }, select: { id: true, saleNumber: true, totalCents: true, status: true, deliveryMethod: true } },
      tasks: { orderBy: { createdAt: "desc" }, take: 30, include: { assignee: { select: { displayName: true, email: true } } } },
      attributions: { orderBy: { capturedAt: "desc" }, take: 10 },
    } }),
    prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } }),
  ]);
  if (!customer) return null;
  return { customer: { ...customer, updatedAt: customer.updatedAt.toISOString(), tasks: customer.tasks.map(t => ({ ...t, updatedAt: t.updatedAt.toISOString(), dueAt: t.dueAt?.toISOString() ?? null })) }, members };
}
export type LeadDetail = NonNullable<Awaited<ReturnType<typeof readLeadDetail>>> & { user: { id: string; role: string } };
