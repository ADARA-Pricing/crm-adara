"use client";
import { useEffect, useState } from "react";
import { replyWindow, type Activity } from "@/lib/conversation-activity";
export function ReplyWindow({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer=setInterval(()=>setNow(Date.now()),30000); return ()=>clearInterval(timer); }, []);
  const window = replyWindow(activity, now ?? Date.now());
  if (compact) {
    const label = now === null ? "Verificando ventana…" : window.label;
    return <span className={`reply-window-dot ${now !== null && window.state === "open" ? "is-open" : "is-closed"}`} role="img" aria-label={label} title={`${label}. Basado en mensajes sincronizados; se verifica nuevamente al enviar.`} />;
  }
  return <span className={`badge ${window.state === "open" ? "success" : "neutral"}`} title="Basado en mensajes sincronizados. El servidor vuelve a validar antes de enviar." suppressHydrationWarning>{now === null ? "Verificando ventana…" : window.label}</span>;
}
