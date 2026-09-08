import React from "react";

const paths: Record<string, string> = {
  "/": "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  "/buscar": "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  "/bandeja": "M3 3h18v14H9l-6 4Z M7 8h10M7 12h7",
  "/clientes": "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 8 0 0 1 16 0v3",
  "/embudo": "M3 4h18l-7 9v7l-4-2v-5Z",
  "/pedidos": "M5 5h14v16H5ZM9 3h6v4H9ZM8 12h8M8 16h5",
  "/logistica": "M2 5h12v12H2ZM14 10h4l4 4v3h-8M8 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  "/cobertura": "M12 22s8-8 8-13a8 8 0 0 0-16 0c0 5 8 13 8 13ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  "/tareas": "M9 6h12M9 12h12M9 18h12M2 5l2 2 3-4M2 11l2 2 3-4M2 17l2 2 3-4",
  "/bot": "M5 7h14v14H5ZM12 3v4M2 11v6M22 11v6M8 12h1M15 12h1M9 17h6",
  "/resultados": "M3 3v18h18M7 17v-5M12 17V8M17 17V4",
  "/productos": "m3 7 9-5 9 5v10l-9 5-9-5Zm0 0 9 5 9-5M12 12v10M7 4l10 6",
  "/marketing": "M3 9v6h4l11 5V4L7 9ZM7 15l2 6h3M21 8v8",
};

export function NavigationIcon({ href }: { href: string }) {
  return <svg className="navigation-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[href] || paths["/"]} /></svg>;
}
