import { CrmShell } from "@/components/crm-shell";
import { ProductEditor } from "@/components/product-editor";

export default function NewProductPage() {
  return <CrmShell active="/productos"><header className="topbar"><div><p className="eyebrow">Catálogo comercial</p><h1>Nuevo producto</h1><p className="topbar-copy">Cargá una ficha completa antes de habilitarla para el bot.</p></div></header><ProductEditor /></CrmShell>;
}
