import { prisma } from "@/lib/prisma";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const aliases: Record<string, string> = {
  "capital federal": "caba",
  "ciudad autonoma de buenos aires": "caba",
  "ciudad de buenos aires": "caba",
  "3 de febrero": "tres de febrero",
  "jose c paz": "jose c paz",
  "virrey del pino": "la matanza 2",
  "tristan suarez": "ezeiza"
};

function isCabaPostalCode(postalCode?: string | null) {
  if (!postalCode) return false;
  const digits = postalCode.toUpperCase().replace(/[^0-9]/g, "");
  const number = Number(digits);
  return Number.isFinite(number) && number >= 1000 && number <= 1499;
}

export async function checkDeliveryCoverage(locality: string, postalCode?: string | null) {
  const normalizedInput = aliases[normalize(locality)] || normalize(locality);
  const zones = await prisma.deliveryCoverageZone.findMany({ where: { isActive: true }, select: { name: true, normalizedName: true, weekCutoffHour: true } });
  const zone = zones.find((item) => item.normalizedName === normalizedInput) || (isCabaPostalCode(postalCode) ? zones.find((item) => item.normalizedName === "caba") : undefined);
  return { covered: Boolean(zone), zoneName: zone?.name, cutoffHour: zone?.weekCutoffHour ?? null };
}
