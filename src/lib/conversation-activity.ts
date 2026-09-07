export type Activity = { lastIncomingAt: string | Date | null; lastOutgoingAt: string | Date | null; channel?: string };
export function replyWindow(activity: Activity, now = Date.now()) {
  if (activity.channel && activity.channel !== "whatsapp") return { state: "other", label: "Otro canal", expiresAt: null } as const;
  const incoming = activity.lastIncomingAt ? new Date(activity.lastIncomingAt).getTime() : NaN;
  if (!Number.isFinite(incoming) || incoming > now) return { state: "unknown", label: "Sin verificar", expiresAt: null } as const;
  const expiresAt = incoming + 86400000;
  if (expiresAt <= now) return { state: "closed", label: "24 h vencidas", expiresAt } as const;
  const minutes = Math.ceil((expiresAt-now)/60000);
  return { state: "open", label: `Disponible · ${Math.floor(minutes/60)} h ${minutes%60} min`, expiresAt } as const;
}
export function needsReply(activity: Activity) {
  return !!activity.lastIncomingAt && (!activity.lastOutgoingAt || new Date(activity.lastIncomingAt).getTime() > new Date(activity.lastOutgoingAt).getTime());
}
export function messageActivity(messages: { direction: string; createdAt: string }[], now = Date.now()) {
  const latest = (direction: string) => {
    const times = messages.filter(m => m.direction === direction).map(m => Date.parse(m.createdAt)).filter(n => Number.isFinite(n) && n <= now);
    return times.length ? new Date(Math.max(...times)) : null;
  };
  return { lastIncomingAt: latest("incoming"), lastOutgoingAt: latest("outgoing") };
}
