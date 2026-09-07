import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CrmShell } from "@/components/crm-shell";
import { ProductEditor } from "@/components/product-editor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();
  return <CrmShell active="/productos"><header className="topbar"><div><p className="eyebrow">Catálogo comercial</p><h1>Editar producto</h1><p className="topbar-copy">Los cambios impactan en la cotización y en la información que recibe el cliente.</p></div></header><ProductEditor product={product} /></CrmShell>;
}
