import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const search = q?.trim() ?? "";
  const customers = await prisma.customer.findMany({ take: 50, where: search ? { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }, { locality: { contains: search, mode: "insensitive" } }] } : undefined, orderBy: { updatedAt: "desc" }, include: { _count: { select: { orders: true } } } });
  return <CrmShell active="/clientes"><header className="topbar"><div><p className="eyebrow">Base de relaciones</p><h1>Clientes</h1><p className="topbar-copy">Una ficha por persona, incluso si todavía no compró.</p></div></header>
    <form className="table-search" action="/clientes"><input name="q" defaultValue={search} placeholder="Buscar por nombre, teléfono o localidad" /><button className="button secondary" type="submit">Buscar</button>{search ? <Link href="/clientes">Limpiar</Link> : null}</form>
    <section className="table-wrap"><table><thead><tr><th>Cliente</th><th>WhatsApp / teléfono</th><th>Pedidos</th><th>Estado</th><th>Última actualización</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td className="primary-cell"><Link className="table-primary-link" href={`/clientes/${customer.id}`}>{customer.fullName || "Sin nombre"}</Link></td><td>{customer.phone || customer.whatsappId || <span className="muted">Sin teléfono</span>}</td><td>{customer._count.orders}</td><td><span className="badge neutral">{customer.status === "LEAD" ? "Contacto" : customer.status}</span></td><td className="muted">{customer.updatedAt.toLocaleDateString("es-AR")}</td></tr>)}</tbody></table>{customers.length === 0 ? <div className="empty">No encontramos clientes con esa búsqueda.</div> : null}</section>
  </CrmShell>;
}
