import Link from "next/link";
import { requireCrmUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inboxWhere } from "@/lib/inbox-filters";
import { inboxShortcuts } from "@/lib/inbox-shortcuts";

export function InboxShortcutsLoading({ raw }: { raw: unknown }) {
  return <nav className="inbox-shortcuts" aria-label="Accesos rápidos de WhatsApp">{inboxShortcuts(raw).map(item => <Link key={item.label} href={item.href} aria-pressed={item.active} className={item.active ? "active" : undefined}>{item.label}<span aria-label="Contador pendiente">…</span></Link>)}</nav>;
}

export async function InboxShortcuts({ raw }: { raw: unknown }) {
  const user = await requireCrmUser();
  const now = new Date();
  const shortcuts = inboxShortcuts(raw);
  const counts = await Promise.all(shortcuts.map(async item => {
    const { filters, where } = inboxWhere(item.selection, user.id, now);
    if (filters.attention === "pending") where.AND = [{ lastIncomingAt: { not: null } }, { OR: [{ lastOutgoingAt: null }, { lastIncomingAt: { gt: prisma.conversation.fields.lastOutgoingAt } }] }];
    if (filters.attention === "answered") where.AND = [{ lastIncomingAt: { not: null } }, { lastOutgoingAt: { gte: prisma.conversation.fields.lastIncomingAt } }];
    try { return await prisma.conversation.count({ where }); } catch { return null; }
  }));
  return <div><nav className="inbox-shortcuts" aria-label="Accesos rápidos de WhatsApp">{shortcuts.map((item, index) => <Link key={item.label} href={item.href} aria-pressed={item.active} className={item.active ? "active" : undefined}>{item.label}<span aria-label={counts[index] === null ? "Contador no disponible" : `${counts[index]} conversaciones`}>{counts[index] ?? "—"}</span></Link>)}</nav><small className="muted">Elegí un acceso rápido a la vez. Volvé a tocar el activo para quitarlo.{counts.some(count => count === null) ? " No pudimos cargar todos los contadores; podés abrir el listado igualmente." : ""}</small></div>;
}
