"use client";
import React from "react";
import { useInboxCache } from "./inbox-preloader";
import { messageActivity, needsReply, type Activity } from "@/lib/conversation-activity";
export function PendingReply({ id, activity }: { id: string; activity: Activity }) {
  const snapshot = useInboxCache()[id];
  const cached = snapshot ? messageActivity(snapshot.messages) : null;
  const latest = (a: string | Date | null, b: Date | null) => {
    const values = [a, b].filter(Boolean).map(value => new Date(value!).getTime()).filter(Number.isFinite);
    return values.length ? new Date(Math.max(...values)) : null;
  };
  const pending = needsReply({ lastIncomingAt: latest(activity.lastIncomingAt, cached?.lastIncomingAt ?? null), lastOutgoingAt: latest(activity.lastOutgoingAt, cached?.lastOutgoingAt ?? null) });
  return pending ? <span className="pending-reply-label" title="Último mensaje del cliente sin respuesta posterior del bot o del equipo">Sin responder</span> : null;
}
