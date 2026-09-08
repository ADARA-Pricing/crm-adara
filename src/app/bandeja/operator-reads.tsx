"use client";
import { useEffect, useRef, useState } from "react";
import { useInboxCache } from "./inbox-preloader";

async function readState(conversationId: string, messageIds?: string[]) {
  const response = await fetch("/api/inbox/reads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, messageIds }), cache: "no-store" });
  if (!response.ok) throw new Error("Lectura no disponible");
  return response.json() as Promise<{ available: boolean; readIds: string[] }>;
}
export function UnreadCount({ id }: { id: string }) {
  const snapshot = useInboxCache()[id];
  const [read, setRead] = useState<string[] | null>(null);
  useEffect(() => {
    let alive = true;
    let version = 0;
    const update = () => { const current = ++version; void readState(id).then(r => { if (alive && current === version) setRead(r.available ? r.readIds : null); }).catch(() => { if (alive && current === version) setRead(null); }); };
    update();
    const changed = (event: Event) => { if ((event as CustomEvent).detail === id) update(); };
    window.addEventListener("crm-read", changed);
    return () => { alive = false; window.removeEventListener("crm-read", changed); };
  }, [id, snapshot]);
  if (!snapshot || read === null) return null;
  const count = new Set(snapshot.messages.filter(m => m.direction === "incoming" && !read.includes(m.id)).map(m => m.id)).size;
  if (!count) return null;
  const label = `${count} mensajes sincronizados sin leer por vos en el CRM${snapshot.nextToken ? ". Historial anterior no incluido" : ""}`;
  return <span className="operator-unread" title={label} aria-label={label}>{count}</span>;
}

export function VisibleReadTracker({ id, revision }: { id: string; revision: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest(".conversation-chat")?.querySelector(".chat-messages");
    if (!root) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const visible = new Set<string>();
    const sent = new Set<string>();
    const flush = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      const ids = [...visible].filter(value => !sent.has(value)).slice(0, 200);
      if (!ids.length) return;
      ids.forEach(value => sent.add(value));
      void readState(id, ids).then(() => { if (!stopped) window.dispatchEvent(new CustomEvent("crm-read", { detail: id })); }).catch(() => ids.forEach(value => sent.delete(value)));
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { const value = (entry.target as HTMLElement).dataset.incomingId; if (value) { if (entry.isIntersecting) visible.add(value); else visible.delete(value); } });
      clearTimeout(timer); timer = setTimeout(flush, 700);
    }, { root, threshold: 0.1 });
    root.querySelectorAll("[data-incoming-id]").forEach(node => observer.observe(node));
    window.addEventListener("focus", flush);
    const retry = setInterval(flush, 5000);
    document.addEventListener("visibilitychange", flush);
    return () => { stopped = true; clearInterval(retry); clearTimeout(timer); observer.disconnect(); window.removeEventListener("focus", flush); document.removeEventListener("visibilitychange", flush); };
  }, [id, revision]);
  return <span ref={anchor} hidden />;
}
