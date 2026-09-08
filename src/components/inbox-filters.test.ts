import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
import { inboxFilterSchema } from "@/lib/inbox-filters";
import { InboxFilters } from "./inbox-filters";

it("keeps only search outside the collapsed filters to prioritize chat space", () => {
  const html = renderToStaticMarkup(createElement(InboxFilters, { filters: inboxFilterSchema.parse({}), members: [], categories: [] }));
  const primary = html.split("<details")[0];
  expect(primary).toContain('name="q"');
  expect(primary).not.toContain("<button");
  for (const name of ["owner", "attention", "filter", "stage", "category", "window", "bought", "sort"]) {
    expect(primary).not.toContain(`name="${name}"`);
    expect(html).toContain(`name="${name}"`);
  }
  expect(html).not.toContain('open=""');
});
it("opens advanced filters when an advanced selection is active", () => {
  const html = renderToStaticMarkup(createElement(InboxFilters, { filters: inboxFilterSchema.parse({ window: "closing" }), members: [], categories: [] }));
  expect(html).toContain('open=""');
  expect(html).toContain("1 activos");
  expect(html).toContain('value="closing" selected=""');
});
