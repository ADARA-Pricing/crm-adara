import { replyWindow, type Activity } from "./conversation-activity";
export function inboxAvailability(activity: Activity, now: number) {
  const value = replyWindow(activity, now);
  const tone = value.state === "closed" ? "expired" : value.state === "open" ? (value.expiresAt - now <= 12 * 3600000 ? "warning" : "available") : "unknown";
  return { tone, label: value.label };
}
