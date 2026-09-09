import Link from "next/link";
import { CrmShell } from "@/components/crm-shell";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crmDate, crmPhone } from "@/lib/crm-display";
import { normalizedPhoneKey } from "@/lib/phone-normalization";

export const dynamic = "force-dynamic";

export default async function DuplicateCustomersPage() {
  await requireCrmUser();
  const customers = await prisma.customer.findMany({ where: { archivedAt: null, phone: { not: null } }, take: 1001, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], select: { id: true, fullName: true, whatsappProfileName: true, phone: true, updatedAt: true } });
  const groups = new Map<string, typeof customers>();
  for (const customer of customers) {
    const key = normalizedPhoneKey(customer.phone);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), customer]);
  }
  const duplicates = [...groups.entries()].filter(([, matches]) => matches.length > 1);
  return <CrmShell active="/clientes"><header className="topbar"><div><p className="eyebrow">Base de relaciones</p><h1>Posibles duplicados</h1><p className="topbar-copy">Coincidencias por teléfono normalizado. Es una sugerencia para revisión, no fusiona ni modifica clientes.</p></div><div className="topbar-actions"><Link className="button secondary" href="/clientes">Volver a clientes</Link></div></header><section className="panel context-note"><strong>{duplicates.length} grupo{duplicates.length === 1 ? "" : "s"} para revisar</strong><p>Se comparan variantes habituales de números argentinos, conservando siempre el valor original. Los números de otros países no se reinterpretan como argentinos.</p>{customers.length > 1000 && <p>Revisión parcial: se evaluaron los 1000 clientes activos actualizados más recientemente.</p>}</section><section className="panel task-table"><table><thead><tr><th>Teléfono comparable</th><th>Registros</th><th>Última actualización</th></tr></thead><tbody>{duplicates.map(([key, matches]) => <tr key={key}><td>{key.replace(/^ar:/, "Argentina · ").replace(/^intl:/, "Internacional · ")}</td><td>{matches.map(customer => <div key={customer.id}><Link className="table-primary-link" href={`/clientes/${customer.id}`}>{customer.fullName || customer.whatsappProfileName || "Contacto sin nombre"}</Link><small> · {crmPhone(customer.phone)}</small></div>)}</td><td>{crmDate(matches.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, matches[0].updatedAt), true)}</td></tr>)}</tbody></table>{!duplicates.length && <div className="empty">No hay coincidencias de teléfono entre los clientes evaluados.</div>}</section></CrmShell>;
}
