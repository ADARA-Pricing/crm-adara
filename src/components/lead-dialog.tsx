"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
export function LeadDialog({ children, closeHref }: { children: ReactNode; closeHref: string }) {
  const dialog = useRef<HTMLDialogElement>(null); const router = useRouter();
  useEffect(() => { dialog.current?.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, []);
  const close = () => router.push(closeHref, { scroll: false });
  return <dialog ref={dialog} className="lead-dialog" aria-label="Ficha del lead" onCancel={e => { e.preventDefault(); close(); }}><div className="lead-dialog-heading"><strong>Ficha del lead</strong><button className="button secondary" onClick={close} autoFocus>Cerrar ficha</button></div>{children}</dialog>;
}
