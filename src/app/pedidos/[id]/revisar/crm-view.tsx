import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatArs, LOCAL_ADDRESS } from "@/lib/sales-policy";
import { checkDeliveryCoverage } from "@/lib/coverage";
import { CrmShell } from "@/components/crm-shell";
import { ReviewForm } from "./review-form";
import { resolveArgentineAddress } from "@/lib/address-resolution";
import { matchingDangerZones } from "@/lib/geo-risk";
import { OrderRiskMap } from "@/components/order-risk-map";
import "./review-map.css";

export const dynamic = "force-dynamic";
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCrmUser();
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { customer: true, items: { include: { product: true } } } });
  if (!order) notFound();
  const pickup = order.deliveryMethod === "PICKUP";
  const coverage = pickup ? null : await checkDeliveryCoverage(order.locality, order.postalCode);
  const [address, zones] = pickup ? [null, []] : await Promise.all([resolveArgentineAddress(order.deliveryAddress, order.locality), prisma.dangerZone.findMany({ where: { isActive: true }, select: { id: true, name: true, latitude: true, longitude: true, radiusMeters: true, note: true } })]);
  const point = address?.resolved && typeof address.latitude === "number" && typeof address.longitude === "number" ? { latitude: address.latitude, longitude: address.longitude } : null;
  const riskMatches = matchingDangerZones(point, zones);
  return <CrmShell active="/pedidos"><header className="topbar"><div><p className="eyebrow">Venta #{order.saleNumber}</p><h1>Revisión comercial</h1><p>La aprobación habilita logística; no significa que la entrega ya esté realizada.</p></div><Link className="button secondary" href={`/pedidos/${id}`}>Volver al pedido</Link></header>
    <section className="panel detail-panel"><h2>Datos a verificar</h2><p>Receptor: {order.recipientName} · Teléfono: {order.recipientPhone || order.customer.phone || "FALTA TELÉFONO"}</p><p>{order.items.map(i => `${i.quantity} × ${i.product.name}`).join(" · ")}</p><p>Total confirmado: <strong>{formatArs(order.totalCents)}</strong> · Envío: {formatArs(order.shippingCents)}</p><p>Pago: {order.paymentMethod === "CASH_OR_TRANSFER" ? "Efectivo o transferencia al recibir/retirar" : order.paymentMethod === "CARD_ONE_PAYMENT" ? "Tarjeta en un pago en el local" : order.paymentMethod}</p><p>Destino: {pickup ? LOCAL_ADDRESS : `${order.deliveryAddress}, ${order.locality} · CP ${order.postalCode || "sin informar"}`}</p><p>Fecha solicitada por el cliente: {order.requestedDate?.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) || "Sin informar"}</p>
      {coverage ? <p>{coverage.covered ? `Referencia de cobertura: ${coverage.zoneName}. Verificá igualmente el domicilio exacto y la seguridad.` : "Cobertura no reconocida automáticamente: consultá con logística antes de aprobar. Si se acuerda una excepción, dejá constancia en observaciones."}</p> : <p>Retiro: lunes a viernes de 10 a 19 h; sábados de 11 a 15 h.</p>}
      {order.riskReview ? <p role="note">Alerta pendiente: {order.reviewReason || "Requiere validación manual."}</p> : null}
    </section>
    {!pickup && <OrderRiskMap point={point} address={`${order.deliveryAddress}, ${order.locality}`} zones={zones} matches={riskMatches}/>}
    {order.status === "PENDING_REVIEW" ? <ReviewForm key={order.updatedAt.toISOString()} id={id} version={order.updatedAt.toISOString()} date={(order.deliveryDate || order.requestedDate)?.toISOString().slice(0,10) || ""} window={order.deliveryTimeWindow || (pickup ? "" : "18 a 21 h")} allowed={user.role === "ADMIN" || user.role === "SALES"}/> : <p>Este pedido ya no está pendiente de revisión. Consultá su historial para ver la decisión registrada.</p>}
  </CrmShell>;
}
