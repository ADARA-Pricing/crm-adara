"use client";

import { usePathname } from "next/navigation";

const titles: Array<[string, string]> = [
  ["/bandeja", "Bandeja WhatsApp"], ["/embudo", "Embudo de ventas"], ["/clientes", "Clientes"],
  ["/pedidos", "Pedidos"], ["/logistica", "Logística"], ["/tareas", "Tareas"], ["/resultados", "Resultados"],
  ["/productos", "Productos"], ["/cobertura", "Cobertura"], ["/marketing", "Meta Ads"], ["/perfil", "Mi perfil"], ["/bot", "Bot"],
];

export function PageSkeleton({ title }: { title?: string }) {
  const pathname = usePathname();
  const routeTitle = title || titles.find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1] || "CRM";
  return <section className="workspace" aria-busy="true" aria-label={routeTitle}><p className="eyebrow">Cargando</p><h1>{routeTitle}</h1><p role="status">Preparando la información…</p><div className="metric-grid" aria-hidden="true">{[0, 1, 2, 3].map(i => <div key={i} className="metric skeleton" />)}</div><div className="skeleton skeleton-table" aria-hidden="true" /></section>;
}
