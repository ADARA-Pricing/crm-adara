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
    let running = false;
    const sent = new Set<string>();
    const flush = async () => {
      if (running || document.visibilityState !== "visible") return;
      const area = root.getBoundingClientRect();
      // Only the actually visible portion of the chat viewport counts as read.
      const top = Math.max(area.top, 0), bottom = Math.min(area.bottom, window.innerHeight);
      const left = Math.max(area.left, 0), right = Math.min(area.right, window.innerWidth);
      if (bottom <= top || right <= left) return;
      const ids = [...root.querySelectorAll<HTMLElement>("[data-incoming-id]")].filter(node => {
        const bounds = node.getBoundingClientRect();
        return bounds.bottom > top && bounds.top < bottom && bounds.right > left && bounds.left < right;
      }).map(node => node.dataset.incomingId!).filter(value => !sent.has(value)).slice(0, 200);
      if (!ids.length) return;
      running = true;
      try {
        const result = await readState(id, ids);
        if (!stopped && result.available) {
          // Do not suppress retries for messages not acknowledged by the server.
          result.readIds.forEach(value => sent.add(value));
          window.dispatchEvent(new CustomEvent("crm-read", { detail: id }));
        }
      } catch { /* Keep the counter until persisted; retry while the chat is visible. */ }
      finally { running = false; }
    };
    const retry = setInterval(() => void flush(), 1500);
    const initial = setTimeout(() => void flush(), 700);
    return () => { stopped = true; clearTimeout(initial); clearInterval(retry); };
  }, [id, revision]);
  return <span ref={anchor} hidden />;
}
