"use client";
import { useEffect, useState } from "react";
import type { LeadDetail } from "@/lib/lead-detail";
import { LeadWorkspace } from "./lead-workspace";

export function LeadLoader({ id, preview, cache, conversationId }: {
  id: string; preview?: { fullName: string | null; phone: string | null; locality: string | null; funnelNote: string | null };
  cache: Map<string, LeadDetail>; conversationId?: string;
}) {
  const [data, setData] = useState(() => cache.get(id));
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setLoading(true); setError("");
    void (async () => {
      try {
        const response = await fetch(`/api/leads/${encodeURIComponent(id)}/detail`, { cache: "no-store", signal: controller.signal });
        if (response.redirected || [401,403,404].includes(response.status)) {
          cache.delete(id); if (active) setData(undefined);
          throw new Error(response.status === 404 ? "Este cliente ya no está disponible." : "Revisá tu sesión para consultar la ficha.");
        }
        if (!response.ok) throw new Error("No se pudo actualizar la ficha.");
        const next: LeadDetail = await response.json();
        if (next.customer?.id !== id || !next.user?.id) throw new Error("Respuesta inválida.");
        if (!active) return;
        cache.delete(id); cache.set(id, next);
        while (cache.size > 20) cache.delete(cache.keys().next().value!);
        setData(next);
      } catch (e) { if(active) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "La consulta tardó demasiado. Podés reintentar."); }
      finally { clearTimeout(timeout); if(active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [id, refresh, cache]);
  return <>{(error || loading) ? <p className="lead-loader-status" role="status">{error || (data ? "Actualizando ficha…" : "Cargando ficha…")}</p> : null}{error && <button className="button secondary" onClick={() => setRefresh(n => n+1)}>Reintentar</button>}
    {data ? <LeadWorkspace data={data} conversationId={conversationId} onRefresh={() => setRefresh(n => n+1)} /> : <section className="panel"><h2>{preview?.fullName || "Ficha del lead"}</h2><p>{preview?.phone}</p><p>{preview?.locality}</p><p>{preview?.funnelNote}</p>{loading && <p>Preparando chat, pedidos y tareas…</p>}</section>}
  </>;
}
