import type { Prisma } from "@prisma/client";
import { funnelStages } from "./funnel-stages";
import type { ListQuery } from "./crm-list-filters";
export function funnelViewFilter(raw: ListQuery, userId: string, now = new Date()) {
  const get = (key: string) => typeof raw[key] === "string" ? raw[key].trim().slice(0, 120) : "";
  const q = get("q"), category = get("category"), owner = get("owner");
  const method = ["COURIER", "PICKUP", "unknown"].find(s => s === get("method"));
  const age = ["7", "30", "unknown"].find(s => s === get("age"));
  const stage = funnelStages.find(([s]) => s === get("viewStage"))?.[0];
  const where: Prisma.CustomerWhereInput = {
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { whatsappProfileName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { locality: { contains: q, mode: "insensitive" } }] } : {}),
    ...(category ? { interestCategories: { has: category } } : {}),
    ...(owner ? { assigneeId: owner === "mine" ? userId : owner === "none" ? null : owner } : {}),
    ...(method ? { deliveryPreference: method === "unknown" ? null : method } : {}),
    ...(stage ? { funnelStage: stage } : {}),
    ...(age ? { lastMessageAt: age === "unknown" ? null : { lt: new Date(now.getTime() - Number(age) * 86400000) } } : {})
  };
  return { q, category, owner, method, age, stage, where };
}
