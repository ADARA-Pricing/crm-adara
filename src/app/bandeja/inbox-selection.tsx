"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { inboxAvailability } from "@/lib/inbox-availability";
import type { Activity } from "@/lib/conversation-activity";

const Selection = createContext<{ id?: string; select: (id: string, href: string) => void }>({ select: () => {} });

export function InboxSelection({ initialId, children }: { initialId?: string; children: React.ReactNode }) {
  const [id, setId] = useState(initialId);
  useEffect(() => {
    const back = () => setId(current => new URLSearchParams(window.location.search).get("conversation") || current || initialId);
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [initialId]);
  return <Selection.Provider value={{ id, select: (next, href) => {
    setId(next);
    // Native history preserves deep links without rerunning the server page.
    window.history.replaceState(null, "", href);
  } }}>{children}</Selection.Provider>;
}

export function InboxContact({ id, href, children, activity }: { id: string; href: string; children: React.ReactNode; activity?: Activity }) {
  const selection = useContext(Selection);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const availability = activity && now !== null ? inboxAvailability(activity, now) : { tone: "unknown", label: "Sin verificar" };
  return <a href={href} title={`${availability.label}. La disponibilidad se verifica nuevamente al enviar.`} data-availability={availability.tone} aria-current={selection.id === id ? "true" : undefined} className={`inbox-contact ${selection.id === id ? "selected" : ""}`} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); selection.select(id, href);
  }}>{children}</a>;
}

export function InboxPanel({ id, children }: { id: string; children: React.ReactNode }) {
  return useContext(Selection).id === id ? children : null;
}
