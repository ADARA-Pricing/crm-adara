"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { moveFunnelContact } from "@/app/embudo/actions";
import { funnelStages, type FunnelStage } from "@/lib/funnel-stages";

type Contact = {
  id: string; fullName: string | null; phone: string | null; locality: string | null; postalCode: string | null;
  deliveryPreference: string | null; deliveryAddress: string | null; lastMessagePreview: string | null; funnelNote: string | null;
  funnelStage: FunnelStage; funnelUpdatedAt: string; dateLabel: string; orderCount: number;
};

export function FunnelBoard({ customers }: { customers: Contact[] }) {
  const router = useRouter();
  const [people, setPeople] = useState(customers);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<FunnelStage | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const busy = useRef(false);
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
  return <><p className="funnel-feedback" role="status">{message || "Arrastrá una tarjeta a otra columna o usá su selector de etapa."}</p>
    <section className="funnel-board" aria-label="Etapas del embudo" aria-busy={Boolean(saving)}>{funnelStages.map(([stage, title, description]) => {
      const contacts = people.filter((person) => person.funnelStage === stage);
      return <article key={stage} className={`funnel-column${target === stage ? " funnel-drop-target" : ""}`}
        onDragOver={(event) => { if (dragging && !busy.current) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setTarget(stage); } }}
        onDrop={(event) => { event.preventDefault(); const id = dragging; setDragging(null); setTarget(null); if (id) void move(id, stage); }}>
        <div className="funnel-column-head"><div><h2>{title}</h2><p>{description}</p></div><span>{contacts.length}</span></div>
        <div className="funnel-cards">{contacts.map((person) => <div key={person.id} className={`funnel-person${dragging === person.id ? " funnel-dragging" : ""}`} draggable={!saving}
          onDragStart={(event) => { if (busy.current) { event.preventDefault(); return; } setDragging(person.id); event.dataTransfer.setData("text/plain", person.id); event.dataTransfer.effectAllowed = "move"; }}
          onDragEnd={() => { setDragging(null); setTarget(null); }}>
          <strong>{person.fullName || "Contacto sin nombre"}</strong><span>{person.phone || "WhatsApp por identificar"}</span>
          {person.locality ? <small>{person.locality}{person.postalCode ? ` · CP ${person.postalCode}` : ""}</small> : null}
          {person.deliveryPreference ? <small>{person.deliveryPreference === "PICKUP" ? "Retiro en local" : "Mensajería privada"}</small> : null}
          {person.deliveryAddress ? <small className="private-detail">{person.deliveryAddress}</small> : null}
          {person.lastMessagePreview ? <small className="message-preview">“{person.lastMessagePreview}”</small> : null}
          {person.funnelNote ? <small>{person.funnelNote}</small> : null}
          <footer>{person.orderCount ? `${person.orderCount} pedido(s)` : "Sin pedido"}<time>{person.dateLabel}</time></footer>
          <label className="funnel-stage-control">{saving === person.id ? "Guardando…" : "Mover a"}<select aria-label={`Etapa de ${person.fullName || person.phone || "contacto"}`} value={person.funnelStage} disabled={Boolean(saving)} onChange={(event) => void move(person.id, event.target.value as FunnelStage)}>{funnelStages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>)}{!contacts.length ? <div className="funnel-empty">{dragging ? "Soltá la tarjeta acá" : "Sin contactos"}</div> : null}</div>
      </article>;
    })}</section></>;
}
