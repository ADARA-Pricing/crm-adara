import { NextResponse } from "next/server";
import { requireCrmUser } from "@/lib/auth";
import { readLeadDetail } from "@/lib/lead-detail";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Authenticate before any customer data or cached detail is returned.
  const user = await requireCrmUser();
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
  try {
    const detail = await readLeadDetail(id);
    if (!detail) return NextResponse.json({ error: "Este cliente ya no está disponible." }, { status: 404, headers });
    return NextResponse.json({ ...detail, user: { id: user.id, role: user.role } }, { headers });
  } catch { return NextResponse.json({ error: "No se pudo cargar la ficha. Probá nuevamente." }, { status: 503, headers }); }
}
