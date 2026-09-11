import type { FunnelStage } from "@prisma/client";

export const AUTOMATED_FOLLOW_UP_TEXT = "¡Hola! ¿Seguís interesado? Si querés, te ayudo con cualquier duda o coordinamos la compra.";
export const FOLLOW_UP_DELAY_MS = 12 * 60 * 60 * 1000;
const excludedStages: FunnelStage[] = ["COORDINATE_DELIVERY", "LOCAL_PICKUP", "COMPLETED", "ABANDONED"];

export function argentinaScheduleParts(now: Date) {
  const values = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  return { weekday: values.find(part => part.type === "weekday")?.value, hour: Number(values.find(part => part.type === "hour")?.value) };
}

export function followUpScheduleOpen(now: Date) {
  const { weekday, hour } = argentinaScheduleParts(now);
  return weekday !== "Sat" && weekday !== "Sun" && hour >= 8 && hour < 18;
}

export function canSendAutomatedFollowUp(input: { now: Date; lastIncomingAt: Date | null; lastOutgoingAt: Date | null; stage: FunnelStage; channel: string }) {
  if (!followUpScheduleOpen(input.now) || input.channel !== "whatsapp" || excludedStages.includes(input.stage)) return false;
  if (!input.lastIncomingAt || !input.lastOutgoingAt || input.lastOutgoingAt <= input.lastIncomingAt) return false;
  if (input.lastIncomingAt <= new Date(input.now.getTime() - 24 * 60 * 60 * 1000)) return false;
  return input.now.getTime() - input.lastOutgoingAt.getTime() >= FOLLOW_UP_DELAY_MS;
}
