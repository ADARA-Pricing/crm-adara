import { funnelStages, type FunnelStage } from "./funnel-stages";

export function visibleFunnelStages(group: string | null, selected?: FunnelStage) {
  return funnelStages.filter(([stage]) => selected ? stage === selected :
    group === "closed" ? stage === "COMPLETED" || stage === "ABANDONED" : stage !== "COMPLETED" && stage !== "ABANDONED");
}

export function lastContactLabel(iso: string | null, now: number) {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "Sin fecha de último mensaje";
  const days = Math.max(0, Math.floor((now - Date.parse(iso)) / 86400000));
  return days === 0 ? "Último mensaje hace menos de 24 h" : `Sin mensajes hace ${days} ${days === 1 ? "día" : "días"}`;
}
