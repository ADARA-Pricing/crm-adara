"use client";

import { useState } from "react";

type Result = { resolved: boolean; normalizedAddress?: string; locality?: string; province?: string; postalCode: null };

export function AddressVerifier({ address, locality }: { address: string; locality: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const verify = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/address/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, locality }) });
      setResult(response.ok ? await response.json() as Result : { resolved: false, postalCode: null });
    } finally { setLoading(false); }
  };
  return <div className="address-verifier">
    <button type="button" className="button secondary" onClick={verify} disabled={loading}>{loading ? "Verificando dirección…" : "Verificar dirección"}</button>
    {result && (result.resolved
      ? <p role="status"><b>Dirección validada:</b> {result.normalizedAddress || address}{result.locality ? ` · ${result.locality}` : ""}{result.province ? `, ${result.province}` : ""}. <small>CP: no informado; no se estima automáticamente.</small></p>
      : <p role="status">No se pudo normalizar la dirección automáticamente. Conservamos los datos informados por el cliente para validación de logística.</p>)}
  </div>;
}
