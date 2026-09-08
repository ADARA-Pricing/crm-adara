"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assignLead } from "@/app/clientes/team-actions";

type Member = { id: string; displayName: string | null; email: string };
export function ChatOwner({ customerId, owner, userId, members }: { customerId: string; owner: Member | null; userId: string; members: Member[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(owner?.id || "");
  const [chosen, setChosen] = useState(owner?.id || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  useEffect(() => { setCurrent(owner?.id || ""); setChosen(owner?.id || ""); }, [owner?.id]);
  const choices = owner && !members.some(m => m.id === owner.id) ? [...members, owner] : members;
  const assigned = choices.find(m => m.id === current);
  async function save(next: string) {
    if (busy.current || next === current) return;
    if (current && !window.confirm(next ? "¿Confirmás cambiar el responsable de este cliente y sus chats?" : "¿Confirmás dejar este cliente y sus chats sin responsable? El estado del bot no cambia.")) return;
    busy.current = true; setSaving(true); setMessage("");
    try {
      const result = await assignLead({ id: customerId, assigneeId: next, expected: current || null });
      if (result.ok) { setCurrent(next); setChosen(next); }
      setMessage(result.message); router.refresh();
    } catch { setMessage("No pudimos confirmar la asignación. Actualizá antes de repetirla."); }
    finally { busy.current = false; setSaving(false); }
  }
  return <section className="chat-owner" aria-label="Responsable de atención">
    <div><strong title={assigned?.email}>Responsable: {assigned ? assigned.displayName || assigned.email : "Sin asignar"}</strong>
      {current && current !== userId && <small className="chat-owner-warning">Asignado a otro operador. Esto no indica si está conectado.</small>}</div>
    <div className="chat-owner-actions"><label>Responsable<select value={chosen} disabled={saving} onChange={event => setChosen(event.target.value)}><option value="">Sin asignar</option>{choices.map(m => <option key={m.id} value={m.id}>{m.displayName || m.email}</option>)}</select></label>
      <button className="button secondary" disabled={saving || chosen === current} onClick={() => void save(chosen)}>Guardar responsable</button>
      {!current && <button className="button secondary" disabled={saving} onClick={() => void save(userId)}>Asignarme</button>}
      {current === userId && <button className="button secondary" disabled={saving} onClick={() => void save("")}>Liberar atención</button>}
    </div><small>La asignación corresponde al cliente y sus chats. No pausa ni reactiva el bot.</small>
    <small role="status">{saving ? "Guardando responsable…" : message}</small>
  </section>;
}
