import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = {
  FIRST_CONTACT: "Primer contacto", INTERESTED: "Interesado", VERY_INTERESTED: "Muy interesado",
  COORDINATE_DELIVERY: "Coordinar envío", LOCAL_PICKUP: "Retiro en local", COMPLETED: "Finalizado", ABANDONED: "Abandonado"
};

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const { conversation } = await searchParams;
  const conversations = await prisma.conversation.findMany({
    take: 80,
    orderBy: { updatedAt: "desc" },
    include: { customer: { include: { _count: { select: { orders: true } } } } }
  });
  const selected = conversations.find((item) => item.id === conversation) ?? conversations[0];

  return <CrmShell active="/bandeja">
    <header className="topbar"><div><p className="eyebrow">Atención</p><h1>Bandeja WhatsApp</h1><p className="topbar-copy">Consultá el contexto comercial sin perder el historial del cliente.</p></div></header>
    <section className="inbox-layout">
      <aside className="inbox-list" aria-label="Conversaciones">
        <div className="inbox-list-heading"><strong>Conversaciones</strong><span>{conversations.length}</span></div>
        {conversations.length ? conversations.map((item) => <Link key={item.id} href={`/bandeja?conversation=${item.id}`} className={`inbox-contact ${selected?.id === item.id ? "selected" : ""}`}>
          <span><strong>{item.customer.fullName ?? "Contacto sin nombre"}</strong><small>{item.customer.phone ?? "WhatsApp por identificar"}</small></span>
          <small>{item.updatedAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</small>
          <p>{item.customer.lastMessagePreview ?? item.summary ?? "Sin mensajes sincronizados todavía."}</p>
        </Link>) : <div className="empty">Cuando llegue un mensaje por WhatsApp, aparecerá en esta bandeja.</div>}
      </aside>
      <article className="inbox-thread">
        {selected ? <>
          <header className="thread-heading"><div><strong>{selected.customer.fullName ?? "Contacto sin nombre"}</strong><small>{selected.customer.phone ?? "Número pendiente de identificar"}</small></div><span className={`badge ${selected.status === "HUMAN_HANDOFF" ? "warning" : "neutral"}`}>{selected.status === "HUMAN_HANDOFF" ? "Derivado a humano" : "Abierta"}</span></header>
          <div className="thread-body"><div className="message-note"><small>Último mensaje registrado</small><p>{selected.customer.lastMessagePreview ?? selected.summary ?? "Aún no se registró el contenido de mensajes de esta conversación."}</p><time>{(selected.customer.lastMessageAt ?? selected.updatedAt).toLocaleString("es-AR")}</time></div></div>
          <footer className="thread-readonly">La respuesta desde CRM se habilitará cuando la integración de WhatsApp permita enviar mensajes de forma auditada.</footer>
        </> : <div className="empty">Elegí una conversación para ver su detalle.</div>}
      </article>
      <aside className="customer-context">
        {selected ? <><h2>Ficha del cliente</h2><dl><div><dt>Etapa</dt><dd>{stageLabels[selected.customer.funnelStage]}</dd></div><div><dt>Teléfono</dt><dd>{selected.customer.phone ?? "Pendiente"}</dd></div><div><dt>Ubicación</dt><dd>{selected.customer.locality ?? "Pendiente"}</dd></div><div><dt>Modalidad</dt><dd>{selected.customer.deliveryPreference === "PICKUP" ? "Retiro en local" : selected.customer.deliveryPreference === "COURIER" ? "Mensajería privada" : "Sin definir"}</dd></div><div><dt>Pedidos</dt><dd>{selected.customer._count.orders}</dd></div></dl>{selected.customer.funnelNote ? <div className="context-note"><small>Nota comercial</small><p>{selected.customer.funnelNote}</p></div> : null}</> : <><h2>Ficha del cliente</h2><p className="muted">El contexto aparecerá al seleccionar una conversación.</p></>}
      </aside>
    </section>
  </CrmShell>;
}
