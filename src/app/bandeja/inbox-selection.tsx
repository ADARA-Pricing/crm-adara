"use client";

import { createContext, useContext, useEffect, useState } from "react";

const Selection = createContext<{ id?: string; select: (id: string, href: string) => void }>({ select: () => {} });

export function InboxSelection({ initialId, children }: { initialId?: string; children: React.ReactNode }) {
  const [id, setId] = useState(initialId);
  useEffect(() => { setId(initialId); }, [initialId]);
  useEffect(() => {
    const back = () => setId(new URLSearchParams(window.location.search).get("conversation") || initialId);
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [initialId]);
  return <Selection.Provider value={{ id, select: (next, href) => {
    setId(next);
    // Native history preserves deep links without rerunning the server page.
    window.history.replaceState(null, "", href);
  } }}>{children}</Selection.Provider>;
}

export function InboxContact({ id, href, children }: { id: string; href: string; children: React.ReactNode }) {
  const selection = useContext(Selection);
  return <a href={href} aria-current={selection.id === id ? "true" : undefined} className={`inbox-contact ${selection.id === id ? "selected" : ""}`} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); selection.select(id, href);
  }}>{children}</a>;
}

export function InboxPanel({ id, children }: { id: string; children: React.ReactNode }) {
  return useContext(Selection).id === id ? children : null;
}
