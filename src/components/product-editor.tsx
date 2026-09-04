import Link from "next/link";
import type { Product } from "@prisma/client";
import { createProduct, updateProduct } from "@/app/productos/actions";

type ProductEditorProps = { product?: Product };

function money(value?: number) { return value ? String(value / 100) : ""; }
function specs(product?: Product) {
  if (!product?.technicalSpecs || typeof product.technicalSpecs !== "object" || Array.isArray(product.technicalSpecs)) return "";
  return Object.entries(product.technicalSpecs as Record<string, unknown>).map(([key, value]) => `${key}: ${String(value)}`).join("\n");
}

export function ProductEditor({ product }: ProductEditorProps) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  return <form action={action} className="product-form">
    <section className="form-section"><h2>Identidad comercial</h2><div className="form-grid"><label>Nombre*<input name="name" defaultValue={product?.name} required placeholder="Ej. Infinix Smart 10 negro" /></label><label>SKU*<input name="sku" defaultValue={product?.sku} required placeholder="INFINIX-SMART-10-NEGRO" /></label><label>Categoría*<input name="category" defaultValue={product?.category || ""} required placeholder="Ej. Celulares" /></label><label>Precio de venta (ARS)*<input name="price" type="number" min="0" step="1" defaultValue={money(product?.priceCents)} required /></label><label>Envío por mensajería (ARS)*<input name="shipping" type="number" min="0" step="1" defaultValue={money(product?.shippingCents)} required /></label></div></section>
    <section className="form-section"><h2>Qué verá el cliente</h2><label>Descripción corta<input name="shortDescription" defaultValue={product?.shortDescription || ""} placeholder="Resumen claro para una respuesta breve." /></label><label>Descripción completa<textarea name="description" defaultValue={product?.description || ""} rows={5} placeholder="Detalle comercial del producto." /></label><label>Características principales <small>Una por línea, con formato “Característica: valor”.</small><textarea name="characteristics" defaultValue={specs(product)} rows={6} placeholder={"RAM: 8 GB (4+4)\nAlmacenamiento: 128 GB\nPantalla: 120 Hz"} /></label><label>Accesorios incluidos <small>Separalos con coma o una línea por accesorio. El bot solo los menciona si se lo preguntan.</small><textarea name="includedItems" defaultValue={product?.includedItems.join("\n") || ""} rows={3} placeholder={"Cargador\nFilm\nFunda"} /></label></section>
    <section className="form-section"><h2>Disponibilidad</h2><label className="checkbox-row"><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> <span><strong>Producto activo para la venta</strong><small>Al desactivarlo, el bot deja de ofrecerlo y no se puede cotizar.</small></span></label></section>
    <div className="form-actions"><Link className="button secondary" href={product ? `/productos/${product.id}` : "/productos"}>Cancelar</Link><button className="button" type="submit">{product ? "Guardar cambios" : "Crear producto"}</button></div>
  </form>;
}
