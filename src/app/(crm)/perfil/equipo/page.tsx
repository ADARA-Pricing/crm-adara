import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TeamManager } from "./team-manager";
export default async function TeamSettingsPage() {
  const admin = await requireAdmin();
  const members = await prisma.userProfile.findMany({ orderBy: [{ isActive: "desc" }, { email: "asc" }], select: { id: true, email: true, displayName: true, role: true, isActive: true } });
  return <div className="settings-page"><aside className="settings-nav" aria-label="Secciones de ajustes"><p className="eyebrow">Ajustes</p><strong>Perfil</strong><Link href="/perfil">Configuración del perfil</Link><span>Espacio de trabajo</span><Link href="/perfil/equipo" aria-current="page">Gestión de usuarios</Link></aside><main className="settings-main"><header className="settings-heading"><div><p className="eyebrow">Administración</p><h1>Gestión de usuarios</h1><p>Configurá los perfiles que ya tienen acceso al CRM.</p></div></header><TeamManager members={members} currentId={admin.id} /></main></div>;
}
