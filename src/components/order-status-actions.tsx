"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/pedidos/actions";
import { orderActions } from "@/lib/order-status";
import Link from "next/link";

export function OrderStatusActions({ id, status, deliveryMethod }: { id: string; status: string; deliveryMethod: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  async function save(next: string, confirmed = false) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try { await updateOrderStatus(id, next, confirmed, reason); setConfirm(null); setChecked(false); setReason(""); router.refresh(); }
    catch { setError("No se pudo aplicar el cambio. Verificá tus permisos y actualizá el pedido antes de reintentar."); }
    finally { busy.current = false; setPending(false); }
  }
  const actions = orderActions(status, deliveryMethod);
  return <div className="order-row-actions">
    {status === "PENDING_REVIEW" ? <Link href={`/pedidos/${id}/revisar`}>Revisar pedido</Link> : null}
    {actions.map(action => <button key={action.status} disabled={pending} onClick={() => {
      if (["DELIVERED", "CANCELLED"].includes(action.status)) { setConfirm(action.status); setChecked(false); }
      else void save(action.status);
    }}>{action.label}</button>)}
    {confirm ? <div className="context-note"><label><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} disabled={pending}/>{confirm === "DELIVERED" ? ` Verifiqué que el pedido fue ${deliveryMethod === "PICKUP" ? "retirado" : "entregado"} y que se realizó el cobro.` : " Confirmo la cancelación de este pedido."}</label>{confirm === "CANCELLED" && <label>Motivo de cancelación<textarea value={reason} minLength={5} maxLength={500} onChange={e => setReason(e.target.value)} disabled={pending} required/></label>}<button disabled={pending || !checked || (confirm === "CANCELLED" && reason.trim().length < 5)} onClick={() => void save(confirm, true)}>{pending ? "Guardando…" : "Confirmar"}</button><button disabled={pending} onClick={() => setConfirm(null)}>Volver</button></div> : null}
    {!actions.length ? <span className="muted">Sin acciones</span> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
