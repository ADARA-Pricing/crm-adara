"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState, type ReactNode } from "react";

const groups = [
  { label: "Principal", links: [["Dashboard", "/"], ["Buscar en CRM", "/buscar"]] },
  { label: "Atención", links: [["Bandeja WhatsApp", "/bandeja"], ["Clientes", "/clientes"], ["Embudo comercial", "/embudo"]] },
  { label: "Ventas", links: [["Pedidos", "/pedidos"]] },
  { label: "Operación", links: [["Logística", "/logistica"], ["Cobertura", "/cobertura"]] },
  { label: "Trabajo", links: [["Tareas", "/tareas"], ["Bot", "/bot"], ["Resultados", "/resultados"]] },
  { label: "Catálogo", links: [["Productos", "/productos"]] },
  { label: "Marketing", links: [["Meta Ads", "/marketing"]] }
];

export function CrmFrame({ children, name, role, signOut }: {
  children?: ReactNode; name: string; role: string; signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [menu, setMenu] = useState<"auto" | "open" | "closed">("auto");
  return <div className="crm-shell persistent-shell" data-menu={menu}>
    <a className="skip-link" href="#crm-content">Ir al contenido</a>
    <button className="menu-open button secondary" title="Abrir menú" aria-label="Abrir menú" aria-controls="crm-navigation" onClick={() => setMenu("open")}>☰</button>
    <aside className="sidebar" id="crm-navigation" aria-label="Menú del CRM">
      <header className="sidebar-heading">
        <Link href="/" className="brand"><Image src="/brand/adara-group.png" alt="Adara group" width={176} height={92} priority /></Link>
        <button className="menu-close button secondary" title="Ocultar menú" aria-label="Ocultar menú" aria-controls="crm-navigation" onClick={() => setMenu("closed")}>‹</button>
      </header>
      {groups.map(group => <nav key={group.label} className="nav-group" aria-label={group.label}>
        <span className="nav-label">{group.label}</span>
        {group.links.map(([label, href]) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} prefetch={true} aria-current={active ? "page" : undefined} className={`nav-item ${active ? "active" : ""}`}>{label}</Link>;
        })}
      </nav>)}
      <div className="sidebar-footer"><strong>{name}</strong><span>{role === "ADMIN" ? "Administrador" : role === "SALES" ? "Ventas" : "Logística"}</span><form action={signOut}><button type="submit">Cerrar sesión</button></form></div>
    </aside>
    <main className="workspace" id="crm-content" tabIndex={-1}>{children}</main>
  </div>;
}
