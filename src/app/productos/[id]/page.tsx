import Link from "next/link";
import { requireCrmUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { CrmShell } from "@/components/crm-shell";
import { prisma } from "@/lib/prisma";
import { formatArs } from "@/lib/sales-policy";
import { DeleteProductButton } from "@/components/delete-product-button";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCrmUser();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) notFound();
  const specs = product.technicalSpecs && typeof product.technicalSpecs === "object" && !Array.isArray(product.technicalSpecs)
    ? Object.entries(product.technicalSpecs as Record<string, unknown>) : [];
  return <CrmShell active="/productos"><header className="topbar"><div><p className="eyebrow">Producto / {product.category || "Sin categoría"}</p><h1>{product.name}</h1><p className="topbar-copy">SKU {product.sku} · <Link href="/productos">Volver al catálogo</Link></p></div>{user.role === "ADMIN" ? <div className="topbar-actions"><Link className="button" href={`/productos/${product.id}/editar`}>Editar producto</Link><DeleteProductButton id={product.id} hasOrders={product._count.orderItems > 0} /></div> : null}</header>
    <section className="metric-grid"><article className="metric"><span className="metric-label">Precio contado</span><strong className="metric-value">{formatArs(product.priceCents)}</strong><span className="metric-detail">Base para efectivo o transferencia.</span></article><article className="metric"><span className="metric-label">Envío por mensajería</span><strong className="metric-value">{formatArs(product.shippingCents)}</strong><span className="metric-detail">Se suma solo a pedidos con envío.</span></article><article className="metric"><span className="metric-label">Bot de ventas</span><strong className="metric-value">{product.isAvailableForBot ? "Habilitado" : "Pausado"}</strong><span className="metric-detail">{product.isActive ? "Producto activo" : "Producto no publicado"}</span></article><article className="metric"><span className="metric-label">Garantía</span><strong className="metric-value">{product.warrantyMonths} meses</strong><span className="metric-detail">Condición comercial visible.</span></article></section>
    <div className="section-heading"><h2>Información que controla este producto</h2></div>
    <section className="operations-grid"><article className="panel"><h3>Ficha comercial</h3><h4>Descripción corta</h4><p>{product.shortDescription || "Sin descripción corta cargada."}</p><h4>Descripción completa</h4><p style={{ whiteSpace: "pre-wrap" }}>{product.description || "Sin descripción completa cargada."}</p><div className="policy-list"><div>Qué puede decir el bot<span>{product.botDescription || "Usar la ficha técnica y las reglas comerciales."}</span></div><div>Incluye — solo si preguntan<span>{product.includedItems.length ? product.includedItems.join(" · ") : "Sin datos cargados."}</span></div></div></article><article className="panel"><h3>Especificaciones</h3><div className="policy-list">{specs.length ? specs.map(([key, value]) => <div key={key}>{key}<span>{String(value)}</span></div>) : <p>Sin especificaciones cargadas.</p>}</div></article></section>
    <div className="section-heading"><h2>Imágenes</h2><span className="muted">Preparado para galería de producto.</span></div><section className="panel"><p>{product.imageUrls.length ? `${product.imageUrls.length} imagen(es) cargada(s).` : "Todavía no hay fotos asociadas. Las cargaremos en Storage para usarlas tanto en el CRM como en el bot."}</p></section>
  </CrmShell>;
}
