"use client";
import { useEffect, useState } from "react";
export function NavigationToggle() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 860px)").matches;
    setCollapsed(narrow);
    document.querySelector(".crm-shell")?.classList.toggle("navigation-collapsed", narrow);
    return () => { document.querySelector(".crm-shell")?.classList.remove("navigation-collapsed"); };
  }, []);
  return <button className="button secondary navigation-toggle" aria-expanded={!collapsed} aria-controls="crm-navigation" onClick={() => {
    const next = !collapsed; setCollapsed(next); document.querySelector(".crm-shell")?.classList.toggle("navigation-collapsed", next);
  }}>{collapsed ? "Abrir menú" : "Ocultar menú"}</button>;
}
