"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createOrderFromChat } from "./actions";
import { formatArs, getPrice, LOCAL_ADDRESS, type DeliveryMethod, type PaymentMethod } from "@/lib/sales-policy";
import { ArgentineDateInput } from "@/components/argentine-date-input";

export function NewChatOrderForm({ conversationId, requestId, paused, allowed, products, customer, orders }: {
  conversationId: string; requestId: string; paused: boolean; allowed: boolean;
  products: { id: string; name: string; priceCents: number; shippingCents: number }[];
  customer: { name: string; phone: string; address: string; locality: string; postalCode: string; deliveryMethod: DeliveryMethod; requestedDate: string };
  orders: { id: string; saleNumber: number; status: string }[];
}) {
  const [state, action, pending] = useActionState(createOrderFromChat, {});
  const [productId, setProduct] = useState(products[0]?.id || "");
  const [method, setMethod] = useState<DeliveryMethod>(customer.deliveryMethod);
  const [payment, setPayment] = useState<PaymentMethod>("CASH_OR_TRANSFER");
  const [confirmed, setConfirmed] = useState(false);
  const product = products.find(p => p.id === productId);
  const terms = product ? getPrice(method, payment, product) : null;
  const back = `/bandeja?conversation=${conversationId}`;
  if (state.orderId) return <section className="panel detail-panel"><h2>Venta #{state.saleNumber} creada</h2><p>Importe final: {formatArs(state.totalCents!)}. Quedó pendiente de revisión, con una tarea para el equipo. El bot continúa pausado.</p><p>No se envió ningún mensaje al cliente. Podés informarle: “Tu número de venta es #{state.saleNumber}. El pedido queda pendiente de revisión y coordinación.”</p><Link className="button" href={`/pedidos/${state.orderId}`}>Ver pedido</Link> <Link className="button secondary" href={back}>Volver al chat</Link></section>;
  return <section className="panel detail-panel">
    <Link className="button secondary" href={back}>Volver al chat</Link>
    {!paused ? <p role="alert">Primero pausá el bot en la conversación para evitar que registre otra venta mientras la cargás.</p> : null}
    {!allowed ? <p role="alert">Solo Administración y Ventas pueden crear pedidos.</p> : null}
    {orders.length ? <p>Pedidos recientes del cliente (revisalos antes de crear otro): {orders.map(o => <span key={o.id}><Link href={`/pedidos/${o.id}`}>Venta #{o.saleNumber}</Link> · </span>)}</p> : null}
    <p>Los datos del cliente están precargados. Confirmá quién recibe: el nombre de perfil de WhatsApp no se toma como nombre del receptor.</p>
    <form action={action} className="manual-order-form" onChange={event => { if (event.target instanceof HTMLElement && event.target.getAttribute("name") !== "confirmed") setConfirmed(false); }}>
      <input type="hidden" name="conversationId" value={conversationId}/><input type="hidden" name="requestId" value={requestId}/>
      <input type="hidden" name="expectedPrice" value={product?.priceCents ?? 0}/><input type="hidden" name="expectedShipping" value={product?.shippingCents ?? 0}/>
      <fieldset disabled={pending || !paused || !allowed || !products.length}>
        <label>Producto (1 unidad)<select name="productId" value={productId} onChange={e => setProduct(e.target.value)} required><option value="" disabled>Seleccionar producto</option>{products.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <label>Nombre de quien recibe<input name="recipientName" defaultValue={customer.name} required minLength={2} maxLength={120}/></label>
        <label>Teléfono de contacto<input name="recipientPhone" type="tel" defaultValue={customer.phone} required minLength={6} maxLength={40}/></label>
        <label>Entrega<select name="deliveryMethod" value={method} onChange={e => { setMethod(e.target.value as DeliveryMethod); setPayment("CASH_OR_TRANSFER"); }}><option value="COURIER">Mensajería privada</option><option value="PICKUP">Retiro en local</option></select></label>
        {method === "COURIER" ? <><label>Dirección y numeración<input name="deliveryAddress" defaultValue={customer.address} required minLength={5} maxLength={240}/></label><label>Localidad<input name="locality" defaultValue={customer.locality} required minLength={2} maxLength={120}/></label><label>Código postal (opcional)<input name="postalCode" defaultValue={customer.postalCode} maxLength={12}/></label></> : <><p>Retira por {LOCAL_ADDRESS}. Lunes a viernes de 10 a 19 h; sábados de 11 a 15 h.</p><input type="hidden" name="deliveryAddress" value=""/><input type="hidden" name="locality" value=""/><input type="hidden" name="postalCode" value=""/></>}
        <label>Fecha solicitada de entrega o retiro<ArgentineDateInput name="requestedDate" defaultValue={customer.requestedDate} required/></label>
        <p>La fecha solicitada no confirma logística. Mensajería habitual de 18 a 21 h; corte a las 12:00. Para sábado debe confirmarse antes del viernes a las 12:00. Los horarios especiales requieren coordinación previa.</p>
        <label>Forma de pago<select name="paymentMethod" value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)}><option value="CASH_OR_TRANSFER">Efectivo o transferencia al recibir / retirar</option>{method === "PICKUP" ? <option value="CARD_ONE_PAYMENT">Tarjeta en un pago en el local (+7%)</option> : null}</select></label>
        <p>Sin seña ni transferencia previa. Compra anticipada o en cuotas: únicamente por la web.</p>
        {terms ? <div className="context-note"><p>Producto: {formatArs(terms.productCents)} · Envío: {formatArs(terms.shippingCents)}{terms.totalCents > terms.productCents + terms.shippingCents ? ` · Financiación: ${formatArs(terms.totalCents - terms.productCents - terms.shippingCents)}` : ""}</p><strong>Total a pagar: {formatArs(terms.totalCents)}</strong></div> : <p>No hay productos activos para vender.</p>}
        <label><input type="checkbox" name="confirmed" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/> El cliente confirmó los datos, la fecha solicitada y el importe final que figuran arriba.</label>
        <button className="button" disabled={pending}>{pending ? "Guardando…" : "Crear pedido pendiente de revisión"}</button>
      </fieldset>
      {state.error ? <p role="alert">{state.error}</p> : null}
    </form>
  </section>;
}
