import { expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/productos/demo/editar" }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({ default: ({ children, href, prefetch: _prefetch, ...rest }: { children: string; href: string; prefetch?: boolean }) => createElement("a", { href, ...rest }, children) }));
import { CrmFrame } from "./crm-frame";

it("keeps the content and navigation in separate semantic regions", () => {
  const html = renderToStaticMarkup(createElement(CrmFrame, { name: "Operador", role: "SALES", signOut: async () => {} }, "Contenido de la sección"));
  expect(html).toContain('aria-label="Menú del CRM"');
  expect(html).toContain('<main class="workspace" id="crm-content"');
  expect(html.indexOf("</aside>")).toBeLessThan(html.indexOf("<main"));
  expect(html).toContain('href="/productos" aria-current="page"');
  expect(html).toContain('aria-label="Abrir menú"');
  expect(html).toContain('aria-label="Ocultar menú"');
});

it("does not expose the connected automations in the menu", () => {
  const html = renderToStaticMarkup(createElement(CrmFrame, { name: "Administrador", role: "ADMIN", signOut: async () => {} }, "Contenido"));
  expect(html).not.toContain('href="/automatizaciones"');
  expect(html).toContain('href="/bandeja"');
});
