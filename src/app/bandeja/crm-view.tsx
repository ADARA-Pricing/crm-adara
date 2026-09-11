import { OperatorAvatar } from "@/components/operator-avatar";
import { PendingReply } from "./pending-reply";
import Link from "next/link";
import { Suspense } from "react";
import { InboxShortcuts, InboxShortcutsLoading } from "@/components/inbox-shortcuts";
import { CRM_TIME_ZONE } from "@/lib/crm-display";
import { CrmShell } from "@/components/crm-shell";
import { manageConversation } from "./actions";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConversationChat } from "./conversation-chat";
import { ChatStage } from "./chat-stage";
import { ChatOwner } from "./chat-owner";
import { InboxPreloader } from "./inbox-preloader";
import { InboxSelection, InboxContact, InboxPanel } from "./inbox-selection";
import { InboxFilters } from "@/components/inbox-filters";

import { inboxWhere } from "@/lib/inbox-filters";
import { needsReply } from "@/lib/conversation-activity";
import { parseInboxSnapshot } from "@/lib/inbox-cache";

import "./inbox-web-layout.css";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = {
  FIRST_CONTACT: "Primer contacto", INTERESTED: "Interesado", VERY_INTERESTED: "Muy interesado",
  COORDINATE_DELIVERY: "Coordinar envío", LOCAL_PICKUP: "Retiro en local", COMPLETED: "Finalizado", ABANDONED: "Abandonado"
};

export default async function InboxPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireCrmUser();
  const raw = await searchParams;
  const { filters, where } = inboxWhere(raw, user.id);
  if (filters.attention === "pending") where.AND = [{ lastIncomingAt: { not: null } }, { OR: [{ lastOutgoingAt: null }, { lastIncomingAt: { gt: prisma.conversation.fields.lastOutgoingAt } }] }];
  if (filters.attention === "answered") where.AND = [{ lastIncomingAt: { not: null } }, { lastOutgoingAt: { gte: prisma.conversation.fields.lastIncomingAt } }];
  const include = { messageCache: true, events: { where: { direction: "INTERNAL" }, orderBy: { createdAt: "desc" as const }, take: 30 }, customer: { include: { assignee: true, _count: { select: { orders: true } } } } };
  async function recentConversations() {
    return prisma.conversation.findMany({ where, skip: (filters.page - 1) * 50, take: 50,
      orderBy: [{ updatedAt: filters.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }], include });
  }
  const [conversations, total, members, categories, candidates] = await Promise.all([
    recentConversations(),
    prisma.conversation.count({ where }),
    prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } }),
    prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } }),
    prisma.conversation.findMany({ take: 80, where: { botpressId: { not: null } }, orderBy: { updatedAt: "desc" }, select: { id: true, customer: { select: { whatsappProfileName: true } } } }),
  ]);
  // Keep an explicitly selected chat mounted even when a live refresh moves it
  // out of the current "sin responder" filter after the operator replies.
  const selected = raw.conversation ? conversations.find(c => c.id === raw.conversation) ?? await prisma.conversation.findUnique({ where: { id: raw.conversation }, include }) : conversations[0];
  const draft = raw.draft && selected ? await prisma.automationRun.findFirst({ where: { id: raw.draft, customerId: selected.customerId, status: "DRAFT" }, select: { id: true, content: true } }) : null;
  const query = new URLSearchParams(Object.entries(raw).filter(([key,value]) => key !== "conversation" && !!value) as [string,string][]);
  const syncList = [...new Map([...conversations,...candidates].map(c => [c.id, { id: c.id, profileName: c.customer.whatsappProfileName }])).values()];
  return <CrmShell active="/bandeja">
    <div className="inbox-workspace">
    <InboxPreloader conversations={syncList} initial={Object.fromEntries(conversations.flatMap(c => { const cached = parseInboxSnapshot(c.messageCache?.payload); return cached ? [[c.id, cached]] : []; }))}>
    <InboxSelection initialId={selected?.id}>
    <section className="inbox-layout">
      <aside className="inbox-list" aria-label="Conversaciones">
<div className="inbox-left-tools">    <header className="inbox-list-appbar"><h1>WhatsApp</h1><span aria-label="Bandeja CRM">CRM</span></header>
    <InboxFilters filters={filters} members={members} categories={categories.map(c=>c.category!)} />
    <details className="inbox-help"><summary>Sobre los filtros y la disponibilidad</summary><p className="muted">Los filtros se combinan. La ventana se calcula con mensajes sincronizados y se verifica al enviar; no equivale a “no leído”. Los chats se actualizan en segundo plano.</p></details>
    <Suspense fallback={<InboxShortcutsLoading raw={raw} />}><InboxShortcuts raw={raw} visibleTotal={total} /></Suspense>

</div><div className="inbox-contact-scroll">
        <div className="availability-legend">Borde: verde &gt;12 h · amarillo ≤12 h · rojo vencido · gris sin verificar</div><div className="inbox-list-heading"><div><strong>Chats</strong><Link className="inbox-sort-trigger" href={`/bandeja?${new URLSearchParams({ ...Object.fromEntries(query), sort: filters.sort === "oldest" ? "recent" : "oldest" })}`} aria-label={filters.sort === "oldest" ? "Ordenar por actividad más reciente" : "Ordenar por actividad más antigua"}>Última actividad {filters.sort === "oldest" ? "↑" : "↓"}</Link></div><span>{total} · página {filters.page}</span></div>
        {conversations.length ? conversations.map((item) => <InboxContact key={item.id} id={item.id} activity={{ channel: item.channel, lastIncomingAt: item.lastIncomingAt?.toISOString() ?? null, lastOutgoingAt: item.lastOutgoingAt?.toISOString() ?? null }} href={`/bandeja?${query}&conversation=${item.id}`}>
          <strong className="inbox-contact-name" title={item.customer.fullName || item.customer.whatsappProfileName || "Contacto sin nombre"}>{item.customer.fullName || item.customer.whatsappProfileName || "Contacto sin nombre"}</strong>
          <PendingReply id={item.id} activity={{ lastIncomingAt: item.lastIncomingAt?.toISOString() ?? null, lastOutgoingAt: item.lastOutgoingAt?.toISOString() ?? null }} />
          <span className="contact-owner-avatar" title={item.customer.assignee ? `Responsable: ${item.customer.assignee.displayName || item.customer.assignee.email}` : "Sin responsable asignado"}><OperatorAvatar userId={item.customer.assignee?.id} name={item.customer.assignee?.displayName || item.customer.assignee?.email || "?"} color={item.customer.assignee?.avatarColor} /></span>
          <small className="inbox-contact-date" title={`Última actividad: ${item.updatedAt.toLocaleString("es-AR", { timeZone: CRM_TIME_ZONE })}`}>{item.updatedAt.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: CRM_TIME_ZONE })}</small>
          <small className="inbox-contact-phone">{item.customer.phone ?? "WhatsApp por identificar"}</small>
          <small className="inbox-contact-meta" title={`${stageLabels[item.customer.funnelStage]} · ${item.customer.assignee?.displayName || item.customer.assignee?.email || "Sin asignar"} · ${item.lastIncomingAt ? needsReply(item) ? "Sin respuesta posterior" : "Respondido" : "Actividad sin verificar"}`}>{stageLabels[item.customer.funnelStage]} · {item.customer.assignee?.displayName || item.customer.assignee?.email || "Sin asignar"} · {item.lastIncomingAt ? needsReply(item) ? "Sin respuesta posterior" : "Respondido" : "Actividad sin verificar"}</small><p title={item.customer.lastMessagePreview ?? item.summary ?? "Sin mensajes sincronizados todavía."}>{item.customer.lastMessagePreview ?? item.summary ?? "Sin mensajes sincronizados todavía."}</p>
        </InboxContact>) : <div className="empty">Cuando llegue un mensaje por WhatsApp, aparecerá en esta bandeja.</div>}
        <div className="topbar-actions">{filters.page > 1 && <Link href={`/bandeja?${new URLSearchParams({ ...Object.fromEntries(query), page: String(filters.page-1) })}`}>Anterior</Link>}{filters.page*50 < total && <Link href={`/bandeja?${new URLSearchParams({ ...Object.fromEntries(query), page: String(filters.page+1) })}`}>Siguiente</Link>}</div>
      </div></aside>
      {[...new Map([...conversations, ...(selected ? [selected] : [])].map(item => [item.id, item])).values()].map(selected => <InboxPanel key={selected.id} id={selected.id}><>
        <article className="inbox-thread">
          <header className="thread-heading"><div><strong>{selected.customer.fullName || selected.customer.whatsappProfileName || "Contacto sin nombre"}</strong><small>{selected.customer.phone ?? "Número pendiente de identificar"}</small></div><span className={`badge ${selected.status === "HUMAN_HANDOFF" ? "warning" : "neutral"}`}>{selected.status === "HUMAN_HANDOFF" ? "Derivado a humano" : selected.status === "CLOSED" ? "Resuelta" : "Abierta"}</span></header>
          <ConversationChat stageControl={<ChatStage conversationId={selected.id} stage={selected.customer.funnelStage} updatedAt={selected.customer.funnelUpdatedAt.toISOString()} />} key={selected.id} id={selected.id} initialPaused={selected.botPaused} channel={selected.channel} refreshPage={false} suggestedDraft={draft && draft.id === raw.draft && selected.id === raw.conversation ? draft : undefined} />
          <footer className="thread-readonly">Los mensajes de WhatsApp Web muestran el autor cuando el canal lo informa. Si no lo informa, se muestran como Equipo/Bot sin atribuirlos a un cliente.</footer>
        </article>
        <aside className="inbox-context-panel" aria-label="Información y gestión de la conversación">
          <header><h2>Ficha del cliente</h2><Link href={`/embudo?lead=${selected.customer.id}`}>Abrir ficha completa</Link></header>
          <div className="customer-context"><dl><div><dt>Etapa</dt><dd>{stageLabels[selected.customer.funnelStage]}</dd></div><div><dt>Teléfono</dt><dd>{selected.customer.phone ?? "Pendiente"}</dd></div><div><dt>Ubicación</dt><dd>{selected.customer.locality ?? "Pendiente"}</dd></div><div><dt>Modalidad</dt><dd>{selected.customer.deliveryPreference === "PICKUP" ? "Retiro en local" : selected.customer.deliveryPreference === "COURIER" ? "Mensajería privada" : "Sin definir"}</dd></div><div><dt>Pedidos</dt><dd>{selected.customer._count.orders}</dd></div></dl>{selected.customer.funnelNote ? <div className="context-note"><small>Nota comercial</small><p>{selected.customer.funnelNote}</p></div> : null}</div>
          <section className="inbox-context-section"><h3>Responsable</h3><ChatOwner customerId={selected.customerId} owner={selected.customer.assignee} userId={user.id} members={members} /></section>
          <section className="inbox-context-section"><Link className="button" href={`/pedidos/nuevo?conversation=${selected.id}`}>Crear pedido</Link></section>
          <section className="inbox-context-section inbox-internal-log"><h3>Notas y actividad</h3>{selected.summary ? <p>{selected.summary}</p> : <p className="muted">Sin resumen interno todavía.</p>}<form action={manageConversation.bind(null, selected.id)}><label htmlFor={`internal-note-${selected.id}`}>Nota para el equipo</label><textarea id={`internal-note-${selected.id}`} name="note" required maxLength={1000} rows={3} placeholder="Seguimiento, dato pendiente o contexto…" /><button className="button secondary" name="action" value="NOTE">Guardar nota</button></form><form action={manageConversation.bind(null, selected.id)}><button className="button ghost" name="action" value={selected.status === "CLOSED" ? "REOPEN" : "RESOLVE"}>{selected.status === "CLOSED" ? "Reabrir caso" : "Marcar resuelto"}</button></form><div className="inbox-event-log">{selected.events.length ? selected.events.map((event) => { const payload = event.payload as { detail?: string; author?: string }; return <article key={event.id}><p>{payload.detail}</p><small>{payload.author} · {event.createdAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</small></article>; }) : <p className="muted">Todavía no hay actividad interna registrada.</p>}</div></section>
        </aside>
      </></InboxPanel>)}
    </section>
    </InboxSelection>
    </InboxPreloader>
    </div>
  </CrmShell>;
}
