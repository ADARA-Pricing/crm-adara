"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeadTask, deleteCustomer } from "@/app/clientes/actions";

export function DeleteCustomerButton({ id, updatedAt }: { id: string; updatedAt: string }) {
  const [open, setOpen] = useState(false), [confirmation, setConfirmation] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();
  return <section><button className="button secondary" onClick={() => setOpen(!open)} disabled={busy}>Eliminar cliente</button>{open && <form onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); try { const r = await deleteCustomer({ id, confirmation, updatedAt }); setMessage(r.message); if(r.ok) { router.push("/clientes"); router.refresh(); } } catch { setMessage("No se pudo eliminar. Revisá tu sesión."); } finally { setBusy(false); } }}><p>Eliminación definitiva de esta ficha, conversaciones guardadas en el CRM, notas, atribuciones y tareas finalizadas. No borra mensajes en Botpress ni bloquea WhatsApp: si vuelve a escribir, la ficha puede crearse nuevamente. No se permite con pedidos o tareas pendientes. Pausá primero el bot en sus chats.</p><label>Escribí ELIMINAR<input value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></label><button className="button" disabled={busy || confirmation !== "ELIMINAR"}>{busy ? "Eliminando…" : "Eliminar definitivamente"}</button><button type="button" className="button secondary" disabled={busy} onClick={() => { setOpen(false); setConfirmation(""); }}>Cancelar</button></form>}<p role="status">{message}</p></section>;
}

export function LeadTaskForm({ customerId, members, currentUserId }: { customerId: string; members: { id: string; name: string }[]; currentUserId: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""); const router = useRouter();
  return <form className="lead-task-form" onSubmit={async e => { e.preventDefault(); if(busy) return; const form = e.currentTarget; const data = new FormData(form); setBusy(true); try { const date = String(data.get("dueAt") || ""); const r = await createLeadTask({ customerId, title: String(data.get("title")), description: String(data.get("description") || ""), assigneeId: String(data.get("assigneeId")), dueAt: date ? new Date(`${date}:00-03:00`).toISOString() : "" }); setMessage(r.message); if(r.ok) { form.reset(); router.refresh(); } } catch { setMessage("No se pudo guardar la tarea. Revisá los datos y tu sesión."); } finally { setBusy(false); } }}>
    <label>Tarea<input name="title" required minLength={3} maxLength={180} /></label><label>Detalle<textarea name="description" maxLength={1000} rows={2} /></label><label>Asignar a<select name="assigneeId" defaultValue={currentUserId} required>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>Vencimiento (hora Argentina)<input name="dueAt" type="datetime-local" /></label><button className="button" disabled={busy}>{busy ? "Guardando…" : "Crear tarea"}</button><p role="status">{message}</p>
  </form>;
}
