import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const zones = await prisma.deliveryCoverageZone.findMany({ orderBy: { name: "asc" } });
  const updatedAt = zones.reduce<Date | null>((latest, zone) => !latest || zone.sourceUpdatedAt > latest ? zone.sourceUpdatedAt : latest, null);
  return <CrmShell active="/cobertura"><header className="topbar"><div><p className="eyebrow">Mensajería privada</p><h1>Cobertura</h1><p className="topbar-copy">Zonas copiadas de la configuración activa de Mercado Envíos Flex. El bot consulta esta base local solamente cuando necesita validar un envío.</p></div></header>
    <section className="logistics-summary"><div><strong>{zones.filter((zone) => zone.isActive).length}</strong><span>zonas activas</span></div><div><strong>12 h</strong><span>corte general</span></div><p><b>CABA:</b> corte configurado a las 16 h. Las zonas no reconocidas quedan para revisión logística, sin prometer entrega.</p></section>
    <section className="table-wrap"><table><thead><tr><th>Zona</th><th>Corte</th><th>Origen</th><th>Estado</th></tr></thead><tbody>{zones.map((zone) => <tr key={zone.id}><td className="primary-cell">{zone.name}</td><td>{zone.weekCutoffHour ? `${zone.weekCutoffHour}:00 h` : "A definir"}</td><td>Mercado Libre Flex</td><td><span className={`badge ${zone.isActive ? "success" : "neutral"}`}>{zone.isActive ? "Activa" : "Pausada"}</span></td></tr>)}</tbody></table>{zones.length === 0 ? <div className="empty">Todavía no hay zonas cargadas.</div> : null}</section>
    <p className="muted" style={{ marginTop: 14 }}>Última importación: {updatedAt?.toLocaleString("es-AR") ?? "—"}. Cuando cambie la cobertura de Mercado Libre, sincronizaremos esta lista.</p>
  </CrmShell>;
}
