"use client";
import { useState } from "react";
import { saveProfile } from "./actions";
import { OperatorAvatar } from "@/components/operator-avatar";
export function ProfileForm({ name, color }: { name: string; color: string }) {
  const [displayName, setName] = useState(name);
  const [avatarColor, setColor] = useState(color);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const colors = [["brown", "Marrón ADARA"], ["green", "Verde"], ["blue", "Azul"], ["purple", "Violeta"]] as const;
  return <form className="product-form" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true);
    try { const result = await saveProfile({ displayName, avatarColor }); setMessage(result.message); }
    catch { setMessage("No pudimos confirmar el guardado. Intentá nuevamente."); }
    finally { setBusy(false); }
  }}><fieldset className="form-section" disabled={busy}>
    <OperatorAvatar name={displayName} color={avatarColor} />
    <label>Nombre visible<input required minLength={2} maxLength={60} autoComplete="nickname" value={displayName} onChange={e => setName(e.target.value)} /></label>
    <fieldset className="avatar-color-options"><legend>Color del avatar</legend>{colors.map(([value, label]) => <label key={value}><input type="radio" name="avatar-color" value={value} checked={avatarColor === value} onChange={() => setColor(value)} /><span className={`avatar-color-swatch ${value}`} aria-hidden="true" />{label}</label>)}</fieldset>
    <small>Este nombre se muestra al equipo. No cambia el correo de acceso ni tus permisos. El avatar usa tus iniciales.</small>
    <button className="button" type="submit">{busy ? "Guardando…" : "Guardar perfil"}</button>
  </fieldset><p role="status">{message}</p></form>;
}
