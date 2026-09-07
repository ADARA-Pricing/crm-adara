"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { InboxSnapshot } from "@/lib/inbox-cache";
import type { warmInboxConversations } from "./chat-actions";

type CachedInbox = Record<string, InboxSnapshot>;
const InboxContext = createContext<CachedInbox>({});
export const useInboxCache = () => useContext(InboxContext);

// Memory is scoped to this authenticated page, never localStorage or a global
// module cache that could expose a previous operator's conversations after logout.
export function InboxPreloader({ conversations, initial, children, refreshPage = true }: {
  refreshPage?: boolean;
  conversations: { id: string; profileName: string | null }[];
  initial: CachedInbox;
  children: React.ReactNode;
}) {
  const [cache, setCache] = useState(initial);
  const current = useRef(conversations);
  current.current = conversations;
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let offset = 0;
    let timer: ReturnType<typeof setTimeout>;
    let lastListRefresh = Date.now();
    async function warm() {
      if (stopped) return;
      if (document.visibilityState !== "visible") { timer = setTimeout(warm, 5000); return; }
      const all = current.current;
      if (offset >= all.length) offset = 0;
      const batch = all.slice(offset, offset + 4);
      offset += batch.length;
      try {
        // A separate request avoids queuing the foreground chat behind a slow
        // background Server Action. Only one warm-up batch runs in this tab.
        const query = new URLSearchParams();
        batch.forEach(c => query.append("id", c.id));
        const response = await fetch(`/api/inbox/warm?${query}`, { cache: "no-store", signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error("Background sync unavailable");
        const results: Awaited<ReturnType<typeof warmInboxConversations>> = await response.json();
        if (!Array.isArray(results)) throw new Error("Invalid sync response");
        if (stopped) return;
        const successful = results.filter(r => r.ok);
        setCache(previous => ({ ...previous, ...Object.fromEntries(successful.map(r => [r.id, { messages: r.messages, nextToken: r.nextToken }])) }));
        const namesChanged = successful.some(r => r.profileName && r.profileName !== all.find(c => c.id === r.id)?.profileName);
        if (namesChanged || Date.now() - lastListRefresh > 30000) {
          lastListRefresh = Date.now(); if (refreshPage) router.refresh();
        }
      } catch { /* Keep cached chats visible; selected chat displays connection errors. */ }
      if (!stopped) timer = setTimeout(warm, offset < current.current.length ? 2500 : 10000);
    }
    void warm();
    return () => { stopped = true; clearTimeout(timer); };
  }, [router, refreshPage]);
  return <InboxContext.Provider value={cache}>{children}</InboxContext.Provider>;
}
