import { describe, expect, it } from "vitest";
import { argentinaDayStart, crmDate, crmPhone, crmStatus } from "./crm-display";
import { messageLink, SafeMessage } from "@/components/safe-message";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
describe("CRM presentation boundaries", () => {
  it("does not expose internal phone identifiers", () => { expect(crmPhone("conv_123456789012")).toBeNull(); expect(crmPhone("abc1166837411")).toBeNull(); expect(crmPhone("+54 9 11 2360-4715")).toBe("+5491123604715"); });
  it("translates and safely handles unknown states", () => { expect(crmStatus("LOCAL_PICKUP")).toBe("Retiro en Av. Cramer"); expect(crmStatus("NEW_INTERNAL_STATE")).toBe("Estado por verificar"); });
  it("formats dates in Argentina independently of host timezone", () => { expect(crmDate("2026-09-08T01:00:00Z")).toBe("07/09/2026"); expect(crmDate("2026-09-08T01:00:00Z", true)).toContain("22:00"); expect(crmDate("bad")).toBe("Fecha por verificar"); });
  it("uses Argentina midnight for dashboard", () => { expect(argentinaDayStart(new Date("2026-09-08T01:00:00Z")).toISOString()).toBe("2026-09-07T03:00:00.000Z"); });
  it("allows only web links", () => { for (const value of ["javascript:alert(1)", "data:text/html,hello", "file:///etc/passwd", "//evil.example"]) expect(messageLink(value)).toBeUndefined(); });
  it("renders formatting without interpreting HTML", () => {
    const html = renderToStaticMarkup(createElement(SafeMessage, { text: '**Hola**\n- Uno\n- Dos\n<script>alert(1)</script>\n[mal](javascript:alert)' }));
    expect(html).toContain("<strong>Hola</strong>"); expect(html).toContain("<ul>"); expect(html).not.toContain("<script>"); expect(html).not.toContain('href="javascript:');
  });
  it("renders safe links with isolation", () => { const html = renderToStaticMarkup(createElement(SafeMessage, { text: "[Web](https://adaragroup.com.ar)" })); expect(html).toContain('rel="noopener noreferrer nofollow"'); });
});
