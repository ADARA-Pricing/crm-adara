import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeAvatar } from "@/lib/avatar-image";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await requireCrmUser();
  const id = new URL(request.url).searchParams.get("id") || user.id;
  if (id.length > 160) return new Response(null, { status: 400 });
  const photo = await prisma.operatorAvatarPhoto.findUnique({ where: { userId: id } });
  if (!photo) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return new Response(new Uint8Array(photo.image), { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const user = await requireCrmUser();
  if (request.headers.get("content-type") !== "application/octet-stream") return new Response(null, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  try {
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > 750_000) { await reader.cancel(); return Response.json({ error: "Máximo 750 KB." }, { status: 413 }); } chunks.push(next.value); }
    const image = await normalizeAvatar(Buffer.concat(chunks));
    await prisma.operatorAvatarPhoto.upsert({ where: { userId: user.id }, create: { userId: user.id, image }, update: { image } });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "No pudimos guardar la imagen. Usá JPG, PNG o WebP de hasta 750 KB." }, { status: 400 }); }
}
export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const user = await requireCrmUser();
  await prisma.operatorAvatarPhoto.deleteMany({ where: { userId: user.id } });
  return Response.json({ ok: true });
}
