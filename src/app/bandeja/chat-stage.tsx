"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { funnelStages, type FunnelStage } from "@/lib/funnel-stages";
import { crmStatus } from "@/lib/crm-display";
import { changeChatStage } from "./stage-actions";

export function ChatStage({ conversationId, stage, updatedAt }: { conversationId: string; stage: FunnelStage; updatedAt: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(stage);
  const [version, setVersion] = useState(updatedAt);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => { setCurrent(stage); setVersion(updatedAt); }, [stage, updatedAt]);
  async function change(next: FunnelStage) {
    if (busy.current || next === current) return;
    busy.current = true; setSaving(true); setMessage("");
    try {
      const result = await changeChatStage({ conversationId, stage: next, updatedAt: version });
      if (result.ok) { setCurrent(next); setVersion(result.updatedAt); }
      setMessage(result.message);
      router.refresh();
    } catch { setMessage("No pudimos confirmar el cambio. Actualizá antes de repetirlo."); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div className="chat-stage"><label>Etapa del embudo<select value={current} disabled={saving} onChange={event => void change(event.target.value as FunnelStage)}>{funnelStages.map(([id]) => <option key={id} value={id}>{crmStatus(id)}</option>)}</select></label><small role="status">{saving ? "Guardando…" : message}</small></div>;
}
