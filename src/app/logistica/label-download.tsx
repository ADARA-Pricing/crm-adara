"use client";
import { useState } from "react";
export function LabelDownload({ ids }: { ids: string[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true); setError("");
    try {
      const query = new URLSearchParams(); ids.forEach(id => query.append("id", id));
      const response = await fetch(`/api/logistica/etiquetas?${query}`, { cache: "no-store" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "No se pudo descargar."); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `adara-${ids.length}-etiquetas.zpl`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo descargar. Reintentá."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" className="button secondary" disabled={busy || !ids.length || ids.length > 50} onClick={download}>{busy ? "Generando…" : "Descargar ZPL"}</button>{error && <p role="alert">{error}</p>}</div>;
}
