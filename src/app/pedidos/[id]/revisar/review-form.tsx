"use client";
import { useActionState } from "react";
import Link from "next/link";
import { reviewOrder } from "./actions";

export function ReviewForm({ id, version, date, window, allowed }: { id: string; version: string; date: string; window: string; allowed: boolean }) {
  const [state, action, pending] = useActionState(reviewOrder, {});
  if (state.saved) return <section className="panel detail-panel"><h2>{state.approved ? "Pedido aprobado para logística" : "Pedido mantenido en revisión"}</h2><p>La decisión quedó registrada. No se envió ningún mensaje al cliente ni se modificó el embudo.</p><Link className="button" href={`/pedidos/${id}`}>Ver pedido</Link></section>;
  return <form action={action} className="panel detail-panel manual-order-form">
    <input type="hidden" name="orderId" value={id}/><input type="hidden" name="version" value={version}/>
    {!allowed ? <p>Solo Administración y Ventas pueden aprobar esta revisión.</p> : null}
    <fieldset disabled={pending || !allowed}>
      <h2>Controles comerciales</h2>
      <label><input type="checkbox" name="recipient"/> Verifiqué quién recibe y el teléfono de contacto.</label>
      <label><input type="checkbox" name="payment"/> El cliente confirmó productos, importe final y forma de pago.</label>
      <label><input type="checkbox" name="delivery"/> Verifiqué dirección/cobertura o retiro en Cramer, fecha, horario y disponibilidad con logística.</label>
      <label><input type="checkbox" name="risk"/> Revisé las alertas y las condiciones de seguridad; no quedan impedimentos para entregar.</label>
      <label>Fecha de entrega o retiro acordada<input type="date" name="deliveryDate" defaultValue={date}/></label>
      <label>Franja acordada<input name="timeWindow" maxLength={100} defaultValue={window} placeholder="Por ejemplo: 18 a 21 h"/></label>
      <p>Mensajería: corte a las 12:00; para sábado, confirmar antes del viernes a las 12:00. Una entrega más temprano requiere coordinación previa. No se entrega los domingos.</p>
      <label>Observaciones / qué falta resolver<textarea name="note" maxLength={1000} rows={4}/></label>
      <div className="topbar-actions"><button className="button" name="decision" value="APPROVE">{pending ? "Guardando…" : "Aprobar para logística"}</button><button className="button secondary" name="decision" value="HOLD">Mantener en revisión</button></div>
    </fieldset>
    {state.error ? <p role="alert">{state.error}</p> : null}
  </form>;
}
