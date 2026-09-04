"use client";

import Link from "next/link";
import { deleteProduct, toggleProductStatus } from "@/app/productos/actions";

export function ProductTableActions({ id, isActive, hasOrders }: { id: string; isActive: boolean; hasOrders: boolean }) {
  const nextLabel = isActive ? "Pausar" : "Activar";
  return <div className="product-row-actions">
    <Link href={`/productos/${id}/editar`}>Editar</Link>
    <form action={toggleProductStatus.bind(null, id, !isActive)}><button type="submit">{nextLabel}</button></form>
    <form action={deleteProduct.bind(null, id)} onSubmit={(event) => {
      const message = hasOrders ? "El producto tiene pedidos: se desactivará para conservar el historial. ¿Continuar?" : "¿Eliminar este producto definitivamente?";
      if (!window.confirm(message)) event.preventDefault();
    }}><button className="delete-link" type="submit">{hasOrders ? "Desactivar" : "Eliminar"}</button></form>
  </div>;
}
