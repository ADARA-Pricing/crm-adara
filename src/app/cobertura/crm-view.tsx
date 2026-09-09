import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";
import { crmDate } from "@/lib/crm-display";
import Link from "next/link";
import { createDangerZone, toggleDangerZone } from "@/app/zonas-riesgo/actions";
import "./coverage.css";

export const dynamic = "force-dynamic";

export default async function CoveragePage({ searchParams }: { searchParams: Promise<{ q?: string; tab?: string }> }) {
  const user = await requireCrmUser();
  const { q = "", tab } = await searchParams;
  const search = q.trim().slice(0, 120);
  const riskTab = tab === "riesgo";
  const zones = await prisma.deliveryCoverageZone.findMany({ where: search ? { name: { contains: search, mode: "insensitive" } } : undefined, orderBy: { name: "asc" } });
  const updatedAt = zones.reduce<Date | null>((latest, zone) => !latest || zone.sourceUpdatedAt > latest ? zone.sourceUpdatedAt : latest, null);
  const dangerZones = riskTab ? await prisma.dangerZone.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }) : [];
  const admin = user.role === "ADMIN";
  return <CrmShell active="/cobertura"><header className="topbar"><div><p className="eyebrow">Mensajería privada</p><h1>Cobertura</h1><p className="topbar-copy">Zonas de alcance y alertas visuales para validar cada envío.</p></div></header>
    <nav className="shipment-tabs" aria-label="Secciones de cobertura"><Link aria-current={!riskTab ? "page" : undefined} href="/cobertura">Zonas de cobertura</Link><Link aria-current={riskTab ? "page" : undefined} href="/cobertura?tab=riesgo">Zonas de riesgo</Link></nav>
    {riskTab ? <><section className="logistics-summary"><div><strong>{dangerZones.filter(zone => zone.isActive).length}</strong><span>zonas de riesgo activas</span></div><p>Los círculos rojos se muestran durante la revisión comercial. Son una alerta visual: no bloquean ni aprueban pedidos automáticamente.</p></section>
      {admin ? <form action={createDangerZone} className="panel manual-order-form danger-zone-form"><h2>Agregar zona de riesgo</h2><label>Nombre<input name="name" required placeholder="Ej.: restricción nocturna"/></label><label>Latitud<input name="latitude" type="number" step="any" required placeholder="-34.6037"/></label><label>Longitud<input name="longitude" type="number" step="any" required placeholder="-58.3816"/></label><label>Radio (metros)<input name="radiusMeters" type="number" min="50" max="10000" required defaultValue="500"/></label><label className="logistics-note">Indicaciones para revisión<textarea name="note" maxLength={500} rows={2} placeholder="Qué debe validar el operador antes de entregar."/></label><button className="button">Guardar zona</button></form> : <p className="panel detail-panel">Solo Administración puede crear o editar zonas de riesgo.</p>}
      <section className="panel detail-panel"><h2>Zonas cargadas</h2>{dangerZones.length ? <div className="compact-list">{dangerZones.map(zone => <div className="compact-row" key={zone.id}><span><strong>{zone.name}</strong><small>{zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)} · radio {zone.radiusMeters} m{zone.note ? ` · ${zone.note}` : ""}</small></span>{admin ? <form action={toggleDangerZone.bind(null, zone.id, !zone.isActive)}><button className="button secondary">{zone.isActive ? "Desactivar" : "Activar"}</button></form> : <b>{zone.isActive ? "Activa" : "Inactiva"}</b>}</div>)}</div> : <p>No hay zonas cargadas todavía.</p>}</section>
    </> : <>
    <form className="table-search"><input aria-label="Buscar zona por nombre" name="q" defaultValue={search} placeholder="Buscar zona por nombre" /><button className="button secondary">Buscar</button><Link href="/cobertura">Limpiar</Link></form>
    <section className="logistics-summary"><div><strong>{zones.filter((zone) => zone.isActive).length}</strong><span>zonas activas en esta vista</span></div><div><strong>12 h</strong><span>corte comercial</span></div><p>Las zonas no reconocidas requieren revisión logística. Esta base no tiene códigos postales asociados: una búsqueda sin resultados no confirma que una dirección esté fuera de cobertura.</p></section>
    <section className="table-wrap"><table><thead><tr><th>Zona</th><th>Corte</th><th>Origen</th><th>Estado</th></tr></thead><tbody>{zones.map((zone) => <tr key={zone.id}><td className="primary-cell">{zone.name}</td><td>{zone.weekCutoffHour ? `${zone.weekCutoffHour}:00 h` : "A definir"}</td><td>Mercado Libre Flex</td><td><span className={`badge ${zone.isActive ? "success" : "neutral"}`}>{zone.isActive ? "Activa" : "Pausada"}</span></td></tr>)}</tbody></table>{zones.length === 0 ? <div className="empty">{search ? "No hay zonas que coincidan con la búsqueda. Probá otro nombre o limpiá el filtro." : "Todavía no hay zonas cargadas."}</div> : null}</section>
    <p className="muted">Última importación de las zonas mostradas: {crmDate(updatedAt, true)}. La sincronización no se modifica en esta mejora.</p>
    </>}
  </CrmShell>;
}
