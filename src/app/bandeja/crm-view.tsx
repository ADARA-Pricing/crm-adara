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
import { inboxPriorityPage } from "@/lib/inbox-priority";
import type { Prisma } from "@prisma/client";

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
  async function priorityConversations() {
    const unanswered: Prisma.ConversationWhereInput = { AND: [{ lastIncomingAt: { not: null } }, { OR: [{ lastOutgoingAt: null }, { lastIncomingAt: { gt: prisma.conversation.fields.lastOutgoingAt } }] }] };
    const answered: Prisma.ConversationWhereInput = { OR: [{ lastIncomingAt: null }, { lastOutgoingAt: { gte: prisma.conversation.fields.lastIncomingAt } }] };
    const pendingWhere = { AND: [where, unanswered] };
    const count = await prisma.conversation.count({ where: pendingWhere });
    const slice = inboxPriorityPage(count, filters.page);
    const orderBy: Prisma.ConversationOrderByWithRelationInput[] = [{ lastIncomingAt: { sort: filters.sort === "oldest" ? "asc" : "desc", nulls: "last" } }, { id: "asc" }];
    const [pending, rest] = await Promise.all([
      slice.pendingTake ? prisma.conversation.findMany({where: pendingWhere, skip: slice.pendingSkip, take: slice.pendingTake, orderBy, include}) : [],
      slice.restTake ? prisma.conversation.findMany({where: {AND:[where,answered]}, skip:slice.restSkip,take:slice.restTake,orderBy,include}) : [],
    ]);
    return [...pending, ...rest];
  }
  const [conversations, total, members, categories, candidates] = await Promise.all([
    priorityConversations(),
    prisma.conversation.count({ where }),
    prisma.userProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true, email: true } }),
    prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true } }),
    prisma.conversation.findMany({ take: 80, where: { botpressId: { not: null } }, orderBy: { updatedAt: "desc" }, select: { id: true, customer: { select: { whatsappProfileName: true } } } }),
  ]);
  const selected = raw.conversation ? conversations.find(c => c.id === raw.conversation) ?? await prisma.conversation.findFirst({ where: { AND: [where, { id: raw.conversation }] }, include }) : conversations[0];
  const draft = raw.draft && selected ? await prisma.automationRun.findFirst({ where: { id: raw.draft, customerId: selected.customerId, status: "DRAFT" }, select: { id: true, content: true } }) : null;
  const query = new URLSearchParams(Object.entries(raw).filter(([key,value]) => key !== "conversation" && !!value) as [string,string][]);
  const syncList = [...new Map([...conversations,...candidates].map(c => [c.id, { id: c.id, profileName: c.customer.whatsappProfileName }])).values()];
  return <CrmShell active="/bandeja">
    <div className="inbox-workspace">
    <InboxPreloader conversations={syncList} initial={Object.fromEntries(conversations.flatMap(c => { const cached = parseInboxSnapshot(c.messageCache?.payload); return cached ? [[c.id, cached]] : []; }))}>
    <InboxSelection initialId={selected?.id}>
    <section className="inbox-layout">
      <aside className="inbox-list" aria-label="Conversaciones">
<div className="inbox-left-tools">    <header className="topbar"><div><h1>Bandeja WhatsApp</h1></div></header>
    <InboxFilters filters={filters} members={members} categories={categories.map(c=>c.category!)} />
    <details className="inbox-help"><summary>Sobre los filtros y la disponibilidad</summary><p className="muted">Los filtros se combinan. La ventana se calcula con mensajes sincronizados y se verifica al enviar; no equivale a “no leído”. Los chats se actualizan en segundo plano.</p></details>
    <Suspense fallback={<InboxShortcutsLoading raw={raw} />}><InboxShortcuts raw={raw} /></Suspense>

</div><div className="inbox-contact-scroll">
        <div className="availability-legend">Borde: verde &gt;12 h · amarillo ≤12 h · rojo vencido · gris sin verificar</div><div className="inbox-list-heading"><strong>Conversaciones</strong><span>{total} · página {filters.page}</span></div>
        {conversations.length ? conversations.map((item) => <InboxContact key={item.id} id={item.id} activity={{ channel: item.channel, lastIncomingAt: item.lastIncomingAt?.toISOString() ?? null, lastOutgoingAt: item.lastOutgoingAt?.toISOString() ?? null }} href={`/bandeja?${query}&conversation=${item.id}`}>
          <strong className="inbox-contact-name" title={item.customer.fullName || item.customer.whatsappProfileName || "Contacto sin nombre"}>{item.customer.fullName || item.customer.whatsappProfileName || "Contacto sin nombre"}</strong>
          <PendingReply id={item.id} activity={{ lastIncomingAt: item.lastIncomingAt?.toISOString() ?? null, lastOutgoingAt: item.lastOutgoingAt?.toISOString() ?? null }} />
          <span className="contact-owner-avatar" title={item.customer.assignee ? `Responsable: ${item.customer.assignee.displayName || item.customer.assignee.email}` : "Sin responsable asignado"}><OperatorAvatar userId={item.customer.assignee?.id} name={item.customer.assignee?.displayName || item.customer.assignee?.email || "?"} color={item.customer.assignee?.avatarColor} /></span>
          <small className="inbox-contact-date">{item.updatedAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: CRM_TIME_ZONE })}</small>
          <small className="inbox-contact-phone">{item.customer.phone ?? "WhatsApp por identificar"}</small>
          <small className="inbox-contact-meta" title={`${stageLabels[item.customer.funnelStage]} · ${item.customer.assignee?.displayName || item.customer.assignee?.email || "Sin asignar"} · ${item.lastIncomingAt ? needsReply(item) ? "Sin respuesta posterior" : "Respondido" : "Actividad sin verificar"}`}>{stageLabels[item.customer.funnelStage]} · {item.customer.assignee?.displayName || item.customer.assignee?.email || "Sin asignar"} · {item.lastIncomingAt ? needsReply(item) ? "Sin respuesta posterior" : "Respondido" : "Actividad sin verificar"}</small><p title={item.customer.lastMessagePreview ?? item.summary ?? "Sin mensajes sincronizados todavía."}>{item.customer.lastMessagePreview ?? item.summary ?? "Sin mensajes sincronizados todavía."}</p>
        </InboxContact>) : <div className="empty">Cuando llegue un mensaje por WhatsApp, aparecerá en esta bandeja.</div>}
        <div className="topbar-actions">{filters.page > 1 && <Link href={`/bandeja?${new URLSearchParams({ ...Object.fromEntries(query), page: String(filters.page-1) })}`}>Anterior</Link>}{filters.page*50 < total && <Link href={`/bandeja?${new URLSearchParams({ ...Object.fromEntries(query), page: String(filters.page+1) })}`}>Siguiente</Link>}</div>
      </div></aside>
      {[...new Map([...conversations, ...(selected ? [selected] : [])].map(item => [item.id, item])).values()].map(selected => <InboxPanel key={selected.id} id={selected.id}><article className="inbox-thread">
        {selected ? <>
          <header className="thread-heading"><div><strong>{selected.customer.fullName || selected.customer.whatsappProfileName || "Contacto sin nombre"}</strong><small>{selected.customer.phone ?? "Número pendiente de identificar"}</small></div><span className={`badge ${selected.status === "HUMAN_HANDOFF" ? "warning" : "neutral"}`}>{selected.status === "HUMAN_HANDOFF" ? "Derivado a humano" : selected.status === "CLOSED" ? "Resuelta" : "Abierta"}</span></header>
          <details className="inbox-crm-tools"><summary>Cliente, responsable y gestión CRM</summary>      <div className="customer-context">
        {selected ? <><h2>Ficha del cliente</h2><Link href={`/embudo?lead=${selected.customer.id}`}>Abrir ficha, responsable y tareas</Link><dl><div><dt>Etapa</dt><dd>{stageLabels[selected.customer.funnelStage]}</dd></div><div><dt>Teléfono</dt><dd>{selected.customer.phone ?? "Pendiente"}</dd></div><div><dt>Ubicación</dt><dd>{selected.customer.locality ?? "Pendiente"}</dd></div><div><dt>Modalidad</dt><dd>{selected.customer.deliveryPreference === "PICKUP" ? "Retiro en local" : selected.customer.deliveryPreference === "COURIER" ? "Mensajería privada" : "Sin definir"}</dd></div><div><dt>Pedidos</dt><dd>{selected.customer._count.orders}</dd></div></dl>{selected.customer.funnelNote ? <div className="context-note"><small>Nota comercial</small><p>{selected.customer.funnelNote}</p></div> : null}</> : <><h2>Ficha del cliente</h2><p className="muted">El contexto aparecerá al seleccionar una conversación.</p></>}
      </div>
          <ChatOwner customerId={selected.customerId} owner={selected.customer.assignee} userId={user.id} members={members} />
          <div className="inbox-management"><Link className="button" href={`/pedidos/nuevo?conversation=${selected.id}`}>Crear pedido desde este chat</Link></div>
          <details className="inbox-management">
            <summary>Gestión interna y notas</summary>
            {selected.summary ? <p>{selected.summary}</p> : null}
            <form action={manageConversation.bind(null, selected.id)}><label htmlFor="internal-note">Nota para el equipo</label><textarea id="internal-note" name="note" required maxLength={1000} rows={3} /><button className="button secondary" name="action" value="NOTE">Guardar nota interna</button></form>
            <form action={manageConversation.bind(null, selected.id)}><button className="button secondary" name="action" value={selected.status === "CLOSED" ? "REOPEN" : "RESOLVE"}>{selected.status === "CLOSED" ? "Reabrir caso" : "Marcar resuelto"}</button></form>
            <p className="muted">Estas acciones registran la gestión interna. No envían mensajes ni pausan o reactivan el bot. Las tareas se gestionan en Trabajo → Tareas.</p>
            {selected.events.map((event) => { const payload = event.payload as { detail?: string; author?: string }; return <div className="context-note" key={event.id}><p>{payload.detail}</p><small>{payload.author} · {event.createdAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</small></div>; })}
          </details>
          <footer className="thread-readonly">Historial disponible en Botpress. Los mensajes manuales enviados desde esta bandeja identifican al operador. Los envíos ya aceptados por WhatsApp no se pueden cancelar al pausar.</footer>
</details>
          <ConversationChat stageControl={<ChatStage conversationId={selected.id} stage={selected.customer.funnelStage} updatedAt={selected.customer.funnelUpdatedAt.toISOString()} />} key={selected.id} id={selected.id} initialPaused={selected.botPaused} channel={selected.channel} refreshPage={false} suggestedDraft={draft && draft.id === raw.draft && selected.id === raw.conversation ? draft : undefined} />
        </> : <div className="empty">Elegí una conversación para ver su detalle.</div>}
      </article>

      </InboxPanel>)}
    </section>
    </InboxSelection>
    </InboxPreloader>
    </div>
  </CrmShell>;
}
