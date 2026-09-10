"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LeadDialog } from "./lead-dialog";
import { LeadLoader } from "./lead-loader";
import type { LeadDetail } from "@/lib/lead-detail";
import { moveFunnelContact } from "@/app/embudo/actions";
import { funnelStages, type FunnelStage } from "@/lib/funnel-stages";
import { lastContactLabel, visibleFunnelStages } from "@/lib/funnel-presentation";

type Contact = {
  assigneeName?: string | null;
  lastMessageAt?: string | null;
  interestCategories: string[];
  id: string; fullName: string | null; phone: string | null; locality: string | null; postalCode: string | null;
  deliveryPreference: string | null; deliveryAddress: string | null; lastMessagePreview: string | null; funnelNote: string | null;
  funnelStage: FunnelStage; funnelUpdatedAt: string; dateLabel: string; orderCount: number;
};

export function FunnelBoard({ customers, category, visibleStage }: { customers: Contact[]; category?: string; visibleStage?: FunnelStage }) {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("lead");
  const columns = visibleFunnelStages(params.get("viewGroup"), visibleStage);
  const mobileStage = columns.find(([stage]) => stage === params.get("mobileStage"))?.[0] || columns[0]?.[0];
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  function changeView(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    if (key === "viewGroup") { next.delete("viewStage"); next.delete("mobileStage"); next.delete("page"); router.push(`/embudo?${next}`, { scroll: false }); }
    else window.history.replaceState(null, "", `/embudo?${next}`);
  }
  // Memory belongs to this mounted board, never localStorage or a shared server cache.
  const detailCache = useRef(new Map<string, LeadDetail>());
  function openLead(id: string) {
    const next = new URLSearchParams(params.toString()); next.set("lead", id); next.delete("conversation");
    window.history.pushState(null, "", `/embudo?${next}`);
  }
  function closeLead() {
    const next = new URLSearchParams(params.toString()); next.delete("lead"); next.delete("conversation");
    window.history.replaceState(null, "", `/embudo${next.size ? `?${next}` : ""}`);
  }
  const [people, setPeople] = useState(customers);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<FunnelStage | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const busy = useRef(false);
  const draggedId = useRef<string | null>(null);
  const lastDragAt = useRef(0);
  const [message, setMessage] = useState("");
  useEffect(() => { setPeople(customers); }, [customers]);
  async function move(id: string, stage: FunnelStage) {
    if (busy.current) return;
    const person = people.find((item) => item.id === id);
    if (!person || person.funnelStage === stage) return;
    busy.current = true; setSaving(id); setMessage("Guardando cambio de etapa…");
    try {
      const result = await moveFunnelContact({ id, stage, updatedAt: person.funnelUpdatedAt });
      if (result.ok) {
        setPeople((current) => current.map((item) => item.id === id ? { ...item, funnelStage: stage, funnelUpdatedAt: result.updatedAt } : item));
        setMessage(`Contacto movido a ${funnelStages.find(([value]) => value === stage)?.[1]}.`);
      } else setMessage(result.message);
      router.refresh();
    } catch { setMessage("No se pudo guardar el cambio. Volvé a intentarlo."); router.refresh(); }
    finally { busy.current = false; setSaving(null); }
  }
  return <><nav className="funnel-view-switch" aria-label="Vista del embudo"><button className="button secondary" aria-pressed={!visibleStage && params.get("viewGroup") !== "closed"} onClick={() => changeView("viewGroup", "active")}>Etapas activas</button><button className="button secondary" aria-pressed={!visibleStage && params.get("viewGroup") === "closed"} onClick={() => changeView("viewGroup", "closed")}>Finalizados y abandonados</button></nav>
    <label className="funnel-mobile-selector">Etapa en pantalla<select value={mobileStage} onChange={event => changeView("mobileStage", event.target.value)}>{columns.map(([stage, title]) => <option key={stage} value={stage}>{title} ({people.filter(person => person.funnelStage === stage).length})</option>)}</select></label>
    <p className="funnel-feedback" role="status">{message || "Arrastrá una tarjeta o usá su selector. Los contadores corresponden a los contactos cargados."}</p>
    <section className={`funnel-board funnel-board-focused${visibleStage ? " funnel-single-stage" : ""}${columns.length === 2 ? " funnel-closed-stages" : ""}`} aria-label="Etapas del embudo" aria-busy={Boolean(saving)}>{columns.map(([stage, title, description]) => {
      const contacts = people.filter((person) => person.funnelStage === stage);
      return <article key={stage} className={`funnel-column${mobileStage === stage ? " funnel-mobile-current" : ""}${target === stage ? " funnel-drop-target" : ""}`}
        onDragOver={(event) => { if (draggedId.current && !busy.current) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setTarget(stage); } }}
        onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || draggedId.current; draggedId.current = null; setDragging(null); setTarget(null); if (id) void move(id, stage); }}>
        <div className="funnel-column-head"><div><h2>{title}</h2><p>{description}</p></div><span>{contacts.length}</span></div>
        <div className="funnel-cards">{contacts.map((person) => <div key={person.id} className={`funnel-person${dragging === person.id ? " funnel-dragging" : ""}`} draggable={!saving}
          role="button" tabIndex={0} aria-label={`Abrir ficha de ${person.fullName || person.phone || "contacto"}`}
          onClick={event => { if (!draggedId.current && Date.now() - lastDragAt.current > 400 && !(event.target as HTMLElement).closest("select, label, button, a")) openLead(person.id); }}
          onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openLead(person.id); } }}
          onDragStart={(event) => { if (busy.current) { event.preventDefault(); return; } draggedId.current = person.id; setDragging(person.id); event.dataTransfer.setData("text/plain", person.id); event.dataTransfer.effectAllowed = "move"; }}
          onDragEnd={() => { lastDragAt.current = Date.now(); draggedId.current = null; setDragging(null); setTarget(null); }}>
          <strong>{person.fullName || "Contacto sin nombre"}</strong><span>{person.phone || "WhatsApp por identificar"}</span>
          {person.interestCategories.length ? <small className="funnel-interest">{person.interestCategories.join(" · ")}</small> : <small className="funnel-interest">Sin interés clasificado</small>}
          <small>Responsable: {person.assigneeName || "Sin asignar"}</small>
          <small>{now === null ? "Último mensaje: pendiente de calcular" : lastContactLabel(person.lastMessageAt ?? null, now)}</small>
          {(person.locality || person.deliveryPreference || person.deliveryAddress || person.lastMessagePreview || person.funnelNote) ? <details className="funnel-card-more"><summary>Ver contexto</summary>{person.locality ? <small>{person.locality}{person.postalCode ? ` · CP ${person.postalCode}` : ""}</small> : null}{person.deliveryPreference ? <small>{person.deliveryPreference === "PICKUP" ? "Retiro en local" : "Mensajería privada"}</small> : null}{person.deliveryAddress ? <small className="private-detail">{person.deliveryAddress}</small> : null}{person.lastMessagePreview ? <small className="message-preview">“{person.lastMessagePreview}”</small> : null}{person.funnelNote ? <small>{person.funnelNote}</small> : null}</details> : null}
          <footer>{person.orderCount ? `${person.orderCount} pedido(s)` : "Sin pedido"}<time>{person.dateLabel}</time></footer>
          <label className="funnel-stage-control">{saving === person.id ? "Guardando…" : "Mover a"}<select aria-label={`Etapa de ${person.fullName || person.phone || "contacto"}`} value={person.funnelStage} disabled={Boolean(saving)} onChange={(event) => void move(person.id, event.target.value as FunnelStage)}>{funnelStages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>)}{!contacts.length ? <div className="funnel-empty">{dragging ? "Soltá la tarjeta acá" : "Sin contactos"}</div> : null}</div>
      </article>;
    })}</section>{dragging && <div className="funnel-terminal-zones" aria-label="Destinos rápidos al arrastrar">
      {([ ["COMPLETED", "Finalizado"], ["ABANDONED", "Abandonado"] ] as const).map(([stage, label]) => <div key={stage} className={`funnel-terminal-zone ${stage === "COMPLETED" ? "success" : "danger"}${target === stage ? " funnel-drop-target" : ""}`} onDragOver={event => { event.preventDefault(); setTarget(stage); }} onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || draggedId.current; draggedId.current = null; setDragging(null); setTarget(null); if (id) void move(id, stage); }}><strong>{label}</strong><span>Soltá para mover la tarjeta</span></div>)}
    </div>}{selectedId && <LeadDialog onClose={closeLead}><LeadLoader key={selectedId} id={selectedId} preview={people.find(p => p.id === selectedId)} cache={detailCache.current} conversationId={params.get("conversation") || undefined} /></LeadDialog>}</>;
}
