import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { manageConversation } from "./actions";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = {
  FIRST_CONTACT: "Primer contacto", INTERESTED: "Interesado", VERY_INTERESTED: "Muy interesado",
  COORDINATE_DELIVERY: "Coordinar envío", LOCAL_PICKUP: "Retiro en local", COMPLETED: "Finalizado", ABANDONED: "Abandonado"
};

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ conversation?: string; filter?: string }> }) {
  await requireCrmUser();
  const { conversation, filter } = await searchParams;
  const conversations = await prisma.conversation.findMany({
    take: 80,
    where: filter === "human" ? { status: "HUMAN_HANDOFF" } : filter === "closed" ? { status: "CLOSED" } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { events: { where: { direction: "INTERNAL" }, orderBy: { createdAt: "desc" }, take: 30 }, customer: { include: { _count: { select: { orders: true } } } } }
  });
  const selected = conversations.find((item) => item.id === conversation) ?? conversations[0];

  return <CrmShell active="/bandeja">
    <header className="topbar"><div><p className="eyebrow">Atención</p><h1>Bandeja WhatsApp</h1><p className="topbar-copy">Consultá el contexto comercial sin perder el historial del cliente.</p></div></header>
    <div className="topbar-actions" style={{ marginBottom: 16 }}><Link className="button secondary" href="/bandeja">Todas</Link><Link className="button secondary" href="/bandeja?filter=human">Derivadas a humano</Link><Link className="button secondary" href="/bandeja?filter=closed">Resueltas</Link></div>
    <section className="inbox-layout">
      <aside className="inbox-list" aria-label="Conversaciones">
        <div className="inbox-list-heading"><strong>Conversaciones</strong><span>{conversations.length}</span></div>
        {conversations.length ? conversations.map((item) => <Link key={item.id} href={`/bandeja?conversation=${item.id}&filter=${filter || "all"}`} className={`inbox-contact ${selected?.id === item.id ? "selected" : ""}`}>
          <span><strong>{item.customer.fullName ?? "Contacto sin nombre"}</strong><small>{item.customer.phone ?? "WhatsApp por identificar"}</small></span>
          <small>{item.updatedAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</small>
          <p>{item.customer.lastMessagePreview ?? item.summary ?? "Sin mensajes sincronizados todavía."}</p>
        </Link>) : <div className="empty">Cuando llegue un mensaje por WhatsApp, aparecerá en esta bandeja.</div>}
      </aside>
      <article className="inbox-thread">
        {selected ? <>
          <header className="thread-heading"><div><strong>{selected.customer.fullName ?? "Contacto sin nombre"}</strong><small>{selected.customer.phone ?? "Número pendiente de identificar"}</small></div><span className={`badge ${selected.status === "HUMAN_HANDOFF" ? "warning" : "neutral"}`}>{selected.status === "HUMAN_HANDOFF" ? "Derivado a humano" : selected.status === "CLOSED" ? "Resuelta" : "Abierta"}</span></header>
          <div className="thread-body"><div className="message-note"><small>Último mensaje registrado</small><p>{selected.customer.lastMessagePreview ?? selected.summary ?? "Aún no se registró el contenido de mensajes de esta conversación."}</p><time>{(selected.customer.lastMessageAt ?? selected.updatedAt).toLocaleString("es-AR")}</time></div></div>
          <section className="inbox-management">
            <h2>Gestión interna</h2>
            {selected.summary ? <p>{selected.summary}</p> : null}
            <form action={manageConversation.bind(null, selected.id)}><label htmlFor="internal-note">Nota para el equipo</label><textarea id="internal-note" name="note" required maxLength={1000} rows={3} /><button className="button secondary" name="action" value="NOTE">Guardar nota interna</button></form>
            <form action={manageConversation.bind(null, selected.id)}><button className="button secondary" name="action" value={selected.status === "CLOSED" ? "REOPEN" : "RESOLVE"}>{selected.status === "CLOSED" ? "Reabrir caso" : "Marcar resuelto"}</button></form>
            <p className="muted">Estas acciones registran la gestión interna. No envían mensajes ni pausan o reactivan el bot. Las tareas se gestionan en Trabajo → Tareas.</p>
            {selected.events.map((event) => { const payload = event.payload as { detail?: string; author?: string }; return <div className="context-note" key={event.id}><p>{payload.detail}</p><small>{payload.author} · {event.createdAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</small></div>; })}
          </section>
          <footer className="thread-readonly">La respuesta desde CRM se habilitará cuando la integración de WhatsApp permita enviar mensajes de forma auditada.</footer>
        </> : <div className="empty">Elegí una conversación para ver su detalle.</div>}
      </article>
      <aside className="customer-context">
        {selected ? <><h2>Ficha del cliente</h2><dl><div><dt>Etapa</dt><dd>{stageLabels[selected.customer.funnelStage]}</dd></div><div><dt>Teléfono</dt><dd>{selected.customer.phone ?? "Pendiente"}</dd></div><div><dt>Ubicación</dt><dd>{selected.customer.locality ?? "Pendiente"}</dd></div><div><dt>Modalidad</dt><dd>{selected.customer.deliveryPreference === "PICKUP" ? "Retiro en local" : selected.customer.deliveryPreference === "COURIER" ? "Mensajería privada" : "Sin definir"}</dd></div><div><dt>Pedidos</dt><dd>{selected.customer._count.orders}</dd></div></dl>{selected.customer.funnelNote ? <div className="context-note"><small>Nota comercial</small><p>{selected.customer.funnelNote}</p></div> : null}</> : <><h2>Ficha del cliente</h2><p className="muted">El contexto aparecerá al seleccionar una conversación.</p></>}
      </aside>
    </section>
  </CrmShell>;
}
