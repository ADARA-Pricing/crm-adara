"use client";

import { deleteProduct } from "@/app/productos/actions";

export function DeleteProductButton({ id, hasOrders }: { id: string; hasOrders: boolean }) {
  return <form action={deleteProduct.bind(null, id)} onSubmit={(event) => {
    const message = hasOrders ? "Este producto tiene pedidos y se desactivará para preservar el historial. ¿Continuar?" : "¿Eliminar este producto? Esta acción no se puede deshacer.";
    if (!window.confirm(message)) event.preventDefault();
  }}><button className="danger-button" type="submit">{hasOrders ? "Desactivar producto" : "Eliminar producto"}</button></form>;
}
