"use client";
import { useState } from "react";
import { saveProfile } from "./actions";
import { OperatorAvatar } from "@/components/operator-avatar";
export function ProfileForm({ name, color }: { name: string; color: string }) {
  const [displayName, setName] = useState(name);
  const [avatarColor, setColor] = useState(color);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="product-form" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true);
    try { const result = await saveProfile({ displayName, avatarColor }); setMessage(result.message); }
    catch { setMessage("No pudimos confirmar el guardado. Intentá nuevamente."); }
    finally { setBusy(false); }
  }}><fieldset className="form-section" disabled={busy}>
    <OperatorAvatar name={displayName} color={avatarColor} />
    <label>Nombre visible<input required minLength={2} maxLength={60} autoComplete="nickname" value={displayName} onChange={e => setName(e.target.value)} /></label>
    <label>Color del avatar<select value={avatarColor} onChange={e => setColor(e.target.value)}><option value="brown">Marrón ADARA</option><option value="green">Verde</option><option value="blue">Azul</option><option value="purple">Violeta</option></select></label>
    <small>Este nombre se muestra al equipo. No cambia el correo de acceso ni tus permisos. El avatar usa tus iniciales.</small>
    <button className="button" type="submit">{busy ? "Guardando…" : "Guardar perfil"}</button>
  </fieldset><p role="status">{message}</p></form>;
}
