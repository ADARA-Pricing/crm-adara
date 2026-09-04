import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

type CrmShellProps = { active: string; children: ReactNode };

const groups = [
  { label: "Principal", links: [["Inicio", "/"], ["Embudo", "/embudo"], ["Pedidos", "/pedidos"], ["Entregas", "/entregas"]] },
  { label: "Atención", links: [["Bandeja WhatsApp", "/bandeja"], ["Clientes", "/clientes"], ["Seguimientos", "/seguimientos"]] },
  { label: "Catálogo", links: [["Productos", "/productos"], ["Categorías", "/categorías"], ["Zonas de entrega", "/zonas"]] },
  { label: "Gestión", links: [["Reportes", "/reportes"], ["Configuración", "/configuración"]] }
];

export function CrmShell({ active, children }: CrmShellProps) {
  return <div className="crm-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><Image src="/brand/adara-group.png" alt="Adara group" width={176} height={92} priority /></Link>
      {groups.map((group) => <nav key={group.label} className="nav-group" aria-label={group.label}>
        <span className="nav-label">{group.label}</span>
        {group.links.map(([name, href]) => <Link key={href} href={href} className={`nav-item ${active === href ? "active" : ""}`}>
          {name}{name === "Pedidos" ? <small>Revisar</small> : null}
        </Link>)}
      </nav>)}
      <div className="sidebar-footer"><strong>Equipo Adara</strong>Operación de ventas · Argentina</div>
    </aside>
    <main className="workspace">{children}</main>
  </div>;
}
