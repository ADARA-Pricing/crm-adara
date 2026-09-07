import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";
import { ConversationChat } from "@/app/bandeja/conversation-chat";
import { InboxPreloader } from "@/app/bandeja/inbox-preloader";
import { parseInboxSnapshot } from "@/lib/inbox-cache";
import { LeadTaskForm, DeleteCustomerButton } from "./lead-actions";
import { funnelStages } from "@/lib/funnel-stages";
import { formatArs } from "@/lib/sales-policy";
import { orderStatusLabel } from "@/lib/order-status";

export async function LeadWorkspace({ id, conversationId, baseHref }: { id: string; conversationId?: string; baseHref: string }) {
  const user = await requireCrmUser();
  const [customer, members] = await Promise.all([
    prisma.customer.findUnique({ where: { id }, include: { conversations: { orderBy: { updatedAt: "desc" }, include: { messageCache: true } }, orders: { orderBy: { saleDate: "desc" } }, tasks: { orderBy: { createdAt: "desc" }, take: 30, include: { assignee: true } }, attributions: { orderBy: { capturedAt: "desc" }, take: 10 } } }),
    prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } }),
  ]);
  if (!customer) return <p>Este cliente ya no está disponible.</p>;
  const selected = customer.conversations.find(c => c.id === conversationId) || customer.conversations[0];
  return <div className="lead-workspace"><section className="panel"><h2>{customer.fullName || customer.whatsappProfileName || "Contacto sin nombre"}</h2><dl className="detail-list">{Object.entries({ "Nombre de WhatsApp": customer.whatsappProfileName, "Teléfono": customer.phone, "WhatsApp ID": customer.whatsappId, "Email": customer.email, "Etapa": funnelStages.find(([s]) => s === customer.funnelStage)?.[1], "Intereses": customer.interestCategories.join(", "), "Dirección": customer.deliveryAddress, "Localidad": customer.locality, "Código postal": customer.postalCode, "Modalidad": customer.deliveryPreference, "Notas": customer.notes, "Nota comercial": customer.funnelNote }).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "Sin datos"}</dd></div>)}</dl><Link href={`/clientes/${id}`}>Abrir ficha completa</Link><h3>Pedidos</h3>{customer.orders.length ? customer.orders.map(o => <p key={o.id}><Link href={`/pedidos/${o.id}`}>Venta #{o.saleNumber}</Link> · {formatArs(o.totalCents)} · {orderStatusLabel(o.status, o.deliveryMethod)}</p>) : <p>Sin pedidos.</p>}<h3>Origen comercial</h3>{customer.attributions.map(a => <p key={a.id}>{[a.source,a.campaignName || a.utmCampaign,a.adName].filter(Boolean).join(" · ") || "Origen sin identificar"}</p>)}{user.role === "ADMIN" && <DeleteCustomerButton id={id} updatedAt={customer.updatedAt.toISOString()} />}</section>
    <section className="panel lead-chat"><h2>Conversación</h2>{selected ? <><nav className="topbar-actions">{customer.conversations.map((c,i) => <Link key={c.id} href={`${baseHref}&conversation=${encodeURIComponent(c.id)}`} scroll={false} className={`button ${selected.id === c.id ? "" : "secondary"}`}>{c.channel} · {i+1}</Link>)}</nav><InboxPreloader key={selected.id} conversations={[{ id: selected.id, profileName: customer.whatsappProfileName }]} initial={(() => { const snapshot = parseInboxSnapshot(selected.messageCache?.payload); return snapshot ? { [selected.id]: snapshot } : {}; })()}><ConversationChat key={selected.id} id={selected.id} initialPaused={selected.botPaused} /></InboxPreloader><Link href={`/pedidos/nuevo?conversation=${selected.id}`}>Crear pedido desde este chat</Link></> : <p>Este cliente no tiene conversaciones vinculadas.</p>}</section>
    <section className="panel"><h2>Tareas del lead</h2><LeadTaskForm customerId={id} members={members.map(m => ({ id: m.id, name: m.displayName || m.email }))} currentUserId={user.id} /><h3>Últimas tareas</h3>{customer.tasks.map(t => <div key={t.id} className="context-note"><strong>{t.title}</strong><p>{t.description}</p><small>{t.assignee?.displayName || t.assignee?.email || "Sin asignar"} · {t.status} {t.dueAt ? `· ${t.dueAt.toLocaleString("es-AR", { timeZone: "America/Buenos_Aires", hourCycle: "h23" })}` : ""}</small></div>)}<Link href="/tareas">Gestionar tareas</Link></section></div>;
}
