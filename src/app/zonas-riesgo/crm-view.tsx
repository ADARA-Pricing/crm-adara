import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CrmShell } from "@/components/crm-shell";
import { createDangerZone, toggleDangerZone } from "./actions";

export const dynamic = "force-dynamic";

export default async function DangerZonesPage() {
  const user = await requireCrmUser();
  const zones = await prisma.dangerZone.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  const admin = user.role === "ADMIN";
  return <CrmShell active="/zonas-riesgo"><header className="topbar"><div><p className="eyebrow">Operación</p><h1>Zonas de riesgo</h1><p>Áreas visuales para orientar la revisión manual. No bloquean ni aprueban ventas automáticamente.</p></div></header>
    {admin ? <form action={createDangerZone} className="panel manual-order-form danger-zone-form"><h2>Agregar zona</h2><label>Nombre<input name="name" required placeholder="Ej.: restricción nocturna"/></label><label>Latitud<input name="latitude" type="number" step="any" required placeholder="-34.6037"/></label><label>Longitud<input name="longitude" type="number" step="any" required placeholder="-58.3816"/></label><label>Radio (metros)<input name="radiusMeters" type="number" min="50" max="10000" required defaultValue="500"/></label><label className="logistics-note">Indicaciones para revisión<textarea name="note" maxLength={500} rows={2} placeholder="Qué debe validar el operador antes de entregar."/></label><button className="button">Guardar zona</button></form> : <p className="panel detail-panel">Solo Administración puede crear o editar zonas de riesgo.</p>}
    <section className="panel detail-panel"><h2>Zonas cargadas</h2>{zones.length ? <div className="compact-list">{zones.map(zone => <div className="compact-row" key={zone.id}><span><strong>{zone.name}</strong><small>{zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)} · radio {zone.radiusMeters} m{zone.note ? ` · ${zone.note}` : ""}</small></span>{admin ? <form action={toggleDangerZone.bind(null, zone.id, !zone.isActive)}><button className="button secondary">{zone.isActive ? "Desactivar" : "Activar"}</button></form> : <b>{zone.isActive ? "Activa" : "Inactiva"}</b>}</div>)}</div> : <p>No hay zonas cargadas todavía.</p>}</section>
  </CrmShell>;
}
