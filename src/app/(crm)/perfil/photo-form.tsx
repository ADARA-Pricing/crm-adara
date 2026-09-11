"use client";
import { useState } from "react";
export function PhotoForm({ hasPhoto }: { hasPhoto: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [photoExists, setPhotoExists] = useState(hasPhoto);
  async function upload(file?: File, remove = false) {
    if (busy || (!remove && !file)) return;
    if (file && file.size > 750_000) { setMessage("La foto debe pesar hasta 750 KB."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/profile/avatar", { method: remove ? "DELETE" : "POST", headers: remove ? undefined : { "Content-Type": "application/octet-stream" }, body: file });
      if (!response.ok) throw new Error();
      window.dispatchEvent(new Event("crm-avatar-changed"));
      setPhotoExists(!remove); setMessage(remove ? "Foto quitada. Se usarán tus iniciales." : "Foto actualizada.");
    } catch { setMessage("No pudimos guardar el cambio. Usá JPG, PNG o WebP de hasta 750 KB."); }
    finally { setBusy(false); }
  }
  return <section className="profile-photo-form"><label className="button secondary">Cambiar foto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label>{photoExists ? <button className="profile-photo-remove" type="button" disabled={busy} onClick={() => void upload(undefined, true)}>Quitar</button> : null}<small>JPG, PNG o WebP · hasta 750 KB.</small><p role="status">{busy ? "Guardando…" : message}</p></section>;
}
