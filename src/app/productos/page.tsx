import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs } from "@/lib/sales-policy";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { updatedAt: "desc" } });
  return <CrmShell active="/productos"><header className="topbar"><div><p className="eyebrow">Catálogo comercial</p><h1>Productos</h1><p className="topbar-copy">Lo que Adara vende y lo que el bot está autorizado a ofrecer.</p></div><button className="button">+ Nuevo producto</button></header>
    <section className="catalog-hero"><div><p className="eyebrow" style={{ color: "#e5b896" }}>Catálogo conectado</p><h2>Una única fuente de verdad para web, WhatsApp y operación.</h2><p>Precio, condiciones, ficha técnica y disponibilidad deben vivir en el producto; el bot solo consulta lo necesario para responder.</p></div></section>
    <div className="section-heading"><h2>{products.length} producto{products.length === 1 ? "" : "s"}</h2><span className="muted">El stock no se consulta automáticamente por el bot todavía.</span></div>
    <section className="table-wrap"><table><thead><tr><th>Producto</th><th>SKU</th><th>Precio contado</th><th>Stock interno</th><th>Estado</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td className="primary-cell">{product.name}</td><td className="muted">{product.sku}</td><td>{formatArs(product.priceCents)}</td><td>{product.stock}</td><td><span className={`badge ${product.isActive ? "" : "neutral"}`}>{product.isActive ? "Activo" : "Pausado"}</span></td></tr>)}</tbody></table>{products.length === 0 ? <div className="empty">Todavía no hay productos cargados.</div> : null}</section>
  </CrmShell>;
}
