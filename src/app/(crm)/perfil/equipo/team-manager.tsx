"use client";
import { useState } from "react";
import { updateTeamMember } from "./actions";

type Member = { id: string; email: string; displayName: string | null; role: "ADMIN" | "SALES" | "LOGISTICS"; isActive: boolean };
export function TeamManager({ members, currentId }: { members: Member[]; currentId: string }) {
  const [rows, setRows] = useState(members);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const change = (id: string, field: keyof Pick<Member, "displayName" | "role" | "isActive">, value: string | boolean) => setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
  return <section className="panel team-manager"><header><div><h2>Usuarios del CRM</h2><p>Administrá los perfiles existentes. Los cambios de rol o estado requieren administración.</p></div><span>{rows.filter(row => row.isActive).length} activos</span></header><div className="team-member-list">{rows.map(member => <form key={member.id} onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(member.id); setMessage(""); try { const result = await updateTeamMember(member); setMessage(result.message); } catch { setMessage("No se pudo confirmar el cambio."); } finally { setBusy(null); } }}><div><strong>{member.displayName || "Sin nombre"}{member.id === currentId ? " · vos" : ""}</strong><small>{member.email}</small></div><label>Nombre<input value={member.displayName || ""} minLength={2} maxLength={60} onChange={event => change(member.id, "displayName", event.target.value)} /></label><label>Rol<select value={member.role} onChange={event => change(member.id, "role", event.target.value)}><option value="ADMIN">Administrador</option><option value="SALES">Ventas</option><option value="LOGISTICS">Logística</option></select></label><label className="team-active"><input type="checkbox" checked={member.isActive} disabled={member.id === currentId} onChange={event => change(member.id, "isActive", event.target.checked)} /> Activo</label><button className="button secondary" disabled={busy === member.id}>{busy === member.id ? "Guardando…" : "Guardar"}</button></form>)}</div><p role="status">{message}</p></section>;
}
