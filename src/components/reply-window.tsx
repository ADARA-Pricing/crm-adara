"use client";
import { useEffect, useState } from "react";
import { replyWindow, type Activity } from "@/lib/conversation-activity";
export function ReplyWindow({ activity }: { activity: Activity }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer=setInterval(()=>setNow(Date.now()),30000); return ()=>clearInterval(timer); }, []);
  const window = replyWindow(activity, now ?? Date.now());
  return <span className={`badge ${window.state === "open" ? "success" : "neutral"}`} title="Basado en mensajes sincronizados. El servidor vuelve a validar antes de enviar." suppressHydrationWarning>{now === null ? "Verificando ventana…" : window.label}</span>;
}
