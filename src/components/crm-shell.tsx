import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { requireCrmUser, signOut } from "@/lib/auth";
import { NavigationToggle } from "./navigation-toggle";

type CrmShellProps = { active: string; children: ReactNode };

const groups = [
  { label: "Principal", links: [["Dashboard", "/"], ["Buscar en CRM", "/buscar"]] },
  { label: "Atención", links: [["Bandeja WhatsApp", "/bandeja"], ["Clientes", "/clientes"], ["Embudo comercial", "/embudo"]] },
  { label: "Ventas", links: [["Pedidos", "/pedidos"]] },
  { label: "Operación", links: [["Logística", "/logistica"], ["Cobertura", "/cobertura"]] },
  { label: "Trabajo", links: [["Tareas", "/tareas"], ["Bot", "/bot"], ["Resultados", "/resultados"], ["Automatizaciones", "/automatizaciones"]] },
  { label: "Catálogo", links: [["Productos", "/productos"]] },
  { label: "Marketing", links: [["Meta Ads", "/marketing"]] }
];

export async function CrmShell({ active, children }: CrmShellProps) {
  const user = await requireCrmUser();
  return <div className="crm-shell">
    <a className="skip-link" href="#crm-content">Ir al contenido</a>
    <NavigationToggle />
    <aside className="sidebar" id="crm-navigation">
      <Link href="/" className="brand"><Image src="/brand/adara-group.png" alt="Adara group" width={176} height={92} priority /></Link>
      {groups.map((group) => <nav key={group.label} className="nav-group" aria-label={group.label}>
        <span className="nav-label">{group.label}</span>
        {group.links.map(([name, href]) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} className={`nav-item ${active === href ? "active" : ""}`}>
          {name}
        </Link>)}
      </nav>)}
      <div className="sidebar-footer"><strong>{user.displayName || user.email}</strong><span>{user.role === "ADMIN" ? "Administrador" : user.role === "SALES" ? "Ventas" : "Logística"}</span><form action={signOut}><button type="submit">Cerrar sesión</button></form></div>
    </aside>
    <main className="workspace" id="crm-content" tabIndex={-1}>{children}</main>
  </div>;
}
