import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { requireCrmUser } from "@/lib/auth";
import { crmDate } from "@/lib/crm-display";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoveragePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCrmUser();
  const { q = "" } = await searchParams;
  const search = q.trim().slice(0, 120);
  const zones = await prisma.deliveryCoverageZone.findMany({ where: search ? { name: { contains: search, mode: "insensitive" } } : undefined, orderBy: { name: "asc" } });
  const updatedAt = zones.reduce<Date | null>((latest, zone) => !latest || zone.sourceUpdatedAt > latest ? zone.sourceUpdatedAt : latest, null);
  return <CrmShell active="/cobertura"><header className="topbar"><div><p className="eyebrow">Mensajería privada</p><h1>Cobertura</h1><p className="topbar-copy">Zonas copiadas de la configuración activa de Mercado Envíos Flex. El bot consulta esta base local solamente cuando necesita validar un envío.</p></div></header>
    <form className="table-search"><input aria-label="Buscar zona por nombre" name="q" defaultValue={search} placeholder="Buscar zona por nombre" /><button className="button secondary">Buscar</button><Link href="/cobertura">Limpiar</Link></form>
    <section className="logistics-summary"><div><strong>{zones.filter((zone) => zone.isActive).length}</strong><span>zonas activas en esta vista</span></div><div><strong>12 h</strong><span>corte comercial</span></div><p>Las zonas no reconocidas requieren revisión logística. Esta base no tiene códigos postales asociados: una búsqueda sin resultados no confirma que una dirección esté fuera de cobertura.</p></section>
    <section className="table-wrap"><table><thead><tr><th>Zona</th><th>Corte</th><th>Origen</th><th>Estado</th></tr></thead><tbody>{zones.map((zone) => <tr key={zone.id}><td className="primary-cell">{zone.name}</td><td>{zone.weekCutoffHour ? `${zone.weekCutoffHour}:00 h` : "A definir"}</td><td>Mercado Libre Flex</td><td><span className={`badge ${zone.isActive ? "success" : "neutral"}`}>{zone.isActive ? "Activa" : "Pausada"}</span></td></tr>)}</tbody></table>{zones.length === 0 ? <div className="empty">{search ? "No hay zonas que coincidan con la búsqueda. Probá otro nombre o limpiá el filtro." : "Todavía no hay zonas cargadas."}</div> : null}</section>
    <p className="muted">Última importación de las zonas mostradas: {crmDate(updatedAt, true)}. La sincronización no se modifica en esta mejora.</p>
  </CrmShell>;
}
