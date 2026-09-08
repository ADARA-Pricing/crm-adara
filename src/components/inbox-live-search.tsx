"use client";
import React, { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
export function InboxLiveSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const composing = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (!(document.activeElement instanceof HTMLInputElement && document.activeElement.name === "q")) setValue(initial); }, [initial]);
  function schedule(next: string) {
    clearTimeout(timer.current);
    if (composing.current) return;
    timer.current = setTimeout(() => {
      const query = new URLSearchParams(window.location.search);
      if (next.trim()) query.set("q", next.trim()); else query.delete("q");
      query.delete("page"); query.delete("conversation"); query.delete("draft");
      startTransition(() => router.replace(`/bandeja?${query}`, { scroll: false }));
    }, 400);
  }
  return <label className="inbox-live-search"><span className="search-accessible-label">Buscar chats</span><span aria-hidden="true" className="search-symbol">⌕</span><input name="q" value={value} autoComplete="off" aria-busy={pending} placeholder="Buscar nombre, teléfono o localidad" onChange={event => { setValue(event.target.value); schedule(event.target.value); }} onCompositionStart={() => { composing.current = true; clearTimeout(timer.current); }} onCompositionEnd={event => { composing.current = false; schedule(event.currentTarget.value); }} /><span className="search-progress" role="status">{pending ? "Buscando…" : ""}</span></label>;
}
