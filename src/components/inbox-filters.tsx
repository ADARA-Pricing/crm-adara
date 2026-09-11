import React from "react";
import { InboxLiveSearch } from "./inbox-live-search";
import Link from "next/link";
import { funnelStages } from "@/lib/funnel-stages";
import type { inboxFilterSchema } from "@/lib/inbox-filters";
import type { z } from "zod";
export function InboxFilters({ filters, members, categories }: { filters: z.infer<typeof inboxFilterSchema>; members: { id: string; displayName: string | null; email: string }[]; categories: string[] }) {
  const extraCount = [filters.stage, filters.category, filters.window, filters.bought, filters.sort !== "recent" ? filters.sort : ""].filter(Boolean).length;
  return <form action="/bandeja" className="panel inbox-filter-form">
    <div className="inbox-search-row task-form">
    <InboxLiveSearch initial={filters.q} />
    </div>
    <details className="inbox-filter-drawer">
    <summary>Filtros{[filters.owner, filters.attention, filters.filter].filter(Boolean).length + extraCount ? ` (${[filters.owner, filters.attention, filters.filter].filter(Boolean).length + extraCount} activos)` : ""}</summary>
    <div className="inbox-filter-grid task-form">
    <label>Responsable<select name="owner" defaultValue={filters.owner}><option value="">Todos</option><option value="mine">Mis clientes</option><option value="none">Sin asignar</option>{members.map(m => <option key={m.id} value={m.id}>{m.displayName || m.email}</option>)}</select></label>
    <label>Atención<select name="attention" defaultValue={filters.attention}><option value="">Todas</option><option value="pending">Último mensaje sin respuesta</option><option value="answered">Con respuesta posterior</option><option value="human">Requiere humano / bot pausado</option><option value="bot">Bot activo</option></select></label>
    <label>Caso<select name="filter" defaultValue={filters.filter}><option value="">Operativos</option><option value="open">Abiertos</option><option value="human">Derivados a humano</option><option value="closed">Archivados / resueltos</option></select></label>
    </div>
    <details className="inbox-extra-filters" open={extraCount > 0}>
      <summary>Más filtros{extraCount ? ` (${extraCount} activos)` : ""}</summary>
      <div className="inbox-filter-grid task-form">
    <label>Etapa<select name="stage" defaultValue={filters.stage}><option value="">Todas</option>{funnelStages.map(([id,name]) => <option value={id} key={id}>{name}</option>)}</select></label>
    <label>Categoría<select name="category" defaultValue={filters.category}><option value="">Todas</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Ventana WhatsApp<select name="window" defaultValue={filters.window}><option value="">Todas</option><option value="open">Disponible (menos de 24 h)</option><option value="closing">Vence en menos de 2 h</option><option value="closed">Vencida</option><option value="unknown">Sin verificar</option></select></label>
    <label>Compras concretadas<select name="bought" defaultValue={filters.bought}><option value="">Todos</option><option value="yes">Ya compró</option><option value="no">Sin compras concretadas</option></select></label>
    <label>Orden<select name="sort" defaultValue={filters.sort}><option value="recent">Última actividad más reciente</option><option value="oldest">Última actividad más antigua</option></select></label>
      </div>
    </details>
    <div className="inbox-filter-actions"><button className="button">Filtrar</button><Link href="/bandeja">Limpiar filtros</Link></div>
    </details>
  </form>;
}
