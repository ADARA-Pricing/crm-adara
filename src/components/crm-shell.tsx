import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { requireCrmUser, signOut } from "@/lib/auth";

type CrmShellProps = { active: string; children: ReactNode };

const groups = [
  { label: "Principal", links: [["Dashboard", "/"]] },
  { label: "Atención", links: [["Bandeja WhatsApp", "/bandeja"], ["Clientes", "/clientes"], ["Embudo comercial", "/embudo"]] },
  { label: "Ventas", links: [["Pedidos", "/pedidos"]] },
  { label: "Operación", links: [["Logística", "/logistica"], ["Cobertura", "/cobertura"]] },
  { label: "Trabajo", links: [["Tareas", "/tareas"], ["Bot", "/bot"], ["Resultados", "/resultados"], ["Automatizaciones", "/automatizaciones"]] },
  { label: "Catálogo", links: [["Productos", "/productos"]] }
];

export async function CrmShell({ active, children }: CrmShellProps) {
  const user = await requireCrmUser();
  return <div className="crm-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><Image src="/brand/adara-group.png" alt="Adara group" width={176} height={92} priority /></Link>
      {groups.map((group) => <nav key={group.label} className="nav-group" aria-label={group.label}>
        <span className="nav-label">{group.label}</span>
        {group.links.map(([name, href]) => <Link key={href} href={href} className={`nav-item ${active === href ? "active" : ""}`}>
          {name}
        </Link>)}
      </nav>)}
      <div className="sidebar-footer"><strong>{user.displayName || user.email}</strong><span>{user.role === "ADMIN" ? "Administrador" : user.role === "SALES" ? "Ventas" : "Logística"}</span><form action={signOut}><button type="submit">Cerrar sesión</button></form></div>
    </aside>
    <main className="workspace">{children}</main>
  </div>;
}
