"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function LeadDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const focusBeforeOpen = document.activeElement;
    dialog.current?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; if (focusBeforeOpen instanceof HTMLElement && focusBeforeOpen.isConnected) focusBeforeOpen.focus({ preventScroll: true }); };
  }, []);
  const close = onClose;
  return <dialog ref={dialog} className="lead-dialog" aria-label="Ficha del lead" onCancel={e => { e.preventDefault(); close(); }}><div className="lead-dialog-heading"><strong>Ficha del lead</strong><button className="button secondary" onClick={close} autoFocus>Cerrar ficha</button></div>{children}</dialog>;
}
