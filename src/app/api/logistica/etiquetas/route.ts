import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { shippingLabel } from "@/lib/shipping-label";
import { resolveArgentineAddress } from "@/lib/address-resolution";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Iniciá sesión para descargar etiquetas." }, { status: 401 });
  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile?.isActive) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const ids = [...new Set(new URL(request.url).searchParams.getAll("id"))];
  if (!ids.length || ids.length > 50 || ids.some(id => !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) return Response.json({ error: "Seleccioná entre 1 y 50 ventas." }, { status: 400 });
  const orders = await prisma.order.findMany({ where: { id: { in: ids } }, include: { customer: { select: { phone: true } }, items: { include: { product: { select: { name: true, sku: true } } }, orderBy: { id: "asc" } } } });
  if (orders.length !== ids.length) return Response.json({ error: "No se encontraron todas las ventas seleccionadas." }, { status: 404 });
  // A customer should not need to know their CPA. Resolve it from the delivery
  // address when missing and retain the result for the next logistics step.
  const hydrated: typeof orders = [];
  for (const order of orders) {
    if (order.postalCode || order.deliveryMethod !== "COURIER") { hydrated.push(order); continue; }
    const resolution = await resolveArgentineAddress(order.deliveryAddress, order.locality);
    if (!resolution.postalCode) { hydrated.push(order); continue; }
    await prisma.order.update({ where: { id: order.id }, data: { postalCode: resolution.postalCode } });
    hydrated.push({ ...order, postalCode: resolution.postalCode });
  }
  let output: string;
  try { output = ids.map(id => shippingLabel(hydrated.find(order => order.id === id)!)).join(""); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "No se pudo generar la etiqueta." }, { status: 422 }); }
  return new Response(output, { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="adara-etiquetas-${orders.length}.zpl"`, "Cache-Control": "private, no-store" } });
}
