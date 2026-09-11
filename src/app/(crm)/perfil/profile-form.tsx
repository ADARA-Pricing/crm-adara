"use client";
import { useState } from "react";
import { saveProfile } from "./actions";
export function ProfileForm({ name, color }: { name: string; color: string }) {
  const [displayName, setName] = useState(name);
  const [avatarColor, setColor] = useState(color);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const colors = [["brown", "Marrón ADARA"], ["green", "Verde"], ["blue", "Azul"], ["purple", "Violeta"]] as const;
  return <form className="profile-editor" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true);
    try { const result = await saveProfile({ displayName, avatarColor }); setMessage(result.message); }
    catch { setMessage("No pudimos confirmar el guardado. Intentá nuevamente."); }
    finally { setBusy(false); }
  }}><fieldset disabled={busy}>
    <label>Nombre visible<input required minLength={2} maxLength={60} autoComplete="nickname" value={displayName} onChange={e => setName(e.target.value)} /></label>
    <fieldset className="avatar-color-options"><legend>Color del avatar</legend>{colors.map(([value, label]) => <label key={value}><input type="radio" name="avatar-color" value={value} checked={avatarColor === value} onChange={() => setColor(value)} /><span className={`avatar-color-swatch ${value}`} aria-hidden="true" />{label}</label>)}</fieldset>
    <small>Este nombre se muestra al equipo en responsables, tareas y atención. No cambia tu correo ni permisos.</small>
    <button className="button" type="submit">{busy ? "Guardando…" : "Guardar perfil"}</button>
  </fieldset><p role="status">{message}</p></form>;
}
