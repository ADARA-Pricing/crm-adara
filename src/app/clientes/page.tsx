import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ take: 50, orderBy: { updatedAt: "desc" }, include: { _count: { select: { orders: true } } } });
  return <CrmShell active="/clientes"><header className="topbar"><div><p className="eyebrow">Base de relaciones</p><h1>Clientes</h1><p className="topbar-copy">Una ficha por persona, incluso si todavía no compró.</p></div></header>
    <section className="table-wrap"><table><thead><tr><th>Cliente</th><th>WhatsApp / teléfono</th><th>Pedidos</th><th>Estado</th><th>Última actualización</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td className="primary-cell">{customer.fullName || "Sin nombre"}</td><td>{customer.phone || customer.whatsappId || <span className="muted">Sin teléfono</span>}</td><td>{customer._count.orders}</td><td><span className="badge neutral">{customer.status === "LEAD" ? "Contacto" : customer.status}</span></td><td className="muted">{customer.updatedAt.toLocaleDateString("es-AR")}</td></tr>)}</tbody></table>{customers.length === 0 ? <div className="empty">Los clientes aparecerán cuando escriban por WhatsApp o se carguen manualmente.</div> : null}</section>
  </CrmShell>;
}
