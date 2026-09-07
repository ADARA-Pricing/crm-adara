import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs } from "@/lib/sales-policy";
import Link from "next/link";
import { ProductTableActions } from "@/components/product-table-actions";
import { requireCrmUser } from "@/lib/auth";
import { productViewFilters } from "@/lib/crm-product-display";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireCrmUser();
  const { search, active } = productViewFilters(await searchParams);
  const products = await prisma.product.findMany({ where: { ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }, { category: { contains: search, mode: "insensitive" } }] } : {}), ...(active === "yes" ? { isActive: true } : active === "no" ? { isActive: false } : {}) }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { orderItems: true } } } });
  return <CrmShell active="/productos"><header className="topbar"><div><p className="eyebrow">Catálogo comercial</p><h1>Productos</h1><p className="topbar-copy">Lo que Adara vende y lo que el bot está autorizado a ofrecer.</p></div>{user.role === "ADMIN" ? <Link className="button" href="/productos/nuevo">+ Nuevo producto</Link> : null}</header>
    <form className="bot-date-form"><label>Buscar producto<input name="q" defaultValue={search} placeholder="Nombre, SKU o categoría" /></label><label>Estado<select name="active" defaultValue={active}><option value="">Todos</option><option value="yes">Activos</option><option value="no">Inactivos</option></select></label><button className="button secondary">Filtrar</button><Link href="/productos">Limpiar filtros</Link></form>
    <section className="panel"><h2>Catálogo conectado</h2><p>Los datos comerciales actuales se conservan. Los filtros no modifican el producto ni su disponibilidad para el bot. No hay una integración de stock verificada.</p></section>
    <div className="section-heading"><h2>{products.length} producto{products.length === 1 ? "" : "s"}</h2><span className="muted">El stock no se consulta automáticamente por el bot todavía.</span></div>
    <section className="table-wrap"><table><thead><tr><th>Producto</th><th>SKU / categoría</th><th>Precio contado</th><th>Envío privado</th><th>Bot</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td className="primary-cell"><Link href={`/productos/${product.id}`}>{product.name}</Link><br /><span className="muted">Garantía {product.warrantyMonths} meses</span></td><td className="muted">{product.sku}<br />{product.category || "Sin categoría"}</td><td>{formatArs(product.priceCents)}</td><td>{formatArs(product.shippingCents)}</td><td><span className={`badge ${product.isAvailableForBot ? "" : "neutral"}`}>{product.isAvailableForBot ? "Autorizado" : "No ofrecer"}</span></td><td><span className={`badge ${product.isActive ? "" : "neutral"}`}>{product.isActive ? "Activo" : "Pausado"}</span></td><td>{user.role === "ADMIN" ? <ProductTableActions id={product.id} isActive={product.isActive} hasOrders={product._count.orderItems > 0} /> : <Link href={`/productos/${product.id}`}>Ver ficha</Link>}</td></tr>)}</tbody></table>{products.length === 0 ? <div className="empty">{search || active ? "No hay productos que coincidan. Probá limpiar los filtros." : "Todavía no hay productos cargados."}</div> : null}</section>
  </CrmShell>;
}
