import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { inboxFilterSchema } from "@/lib/inbox-filters";
import { InboxFilters } from "./inbox-filters";

it("keeps four primary filters outside the collapsed advanced group", () => {
  const html = renderToStaticMarkup(createElement(InboxFilters, { filters: inboxFilterSchema.parse({}), members: [], categories: [] }));
  const primary = html.split("<details")[0];
  for (const name of ["q", "owner", "attention", "filter"]) expect(primary).toContain(`name="${name}"`);
  for (const name of ["stage", "category", "window", "bought", "sort"]) expect(primary).not.toContain(`name="${name}"`);
  expect(html).not.toContain('open=""');
});
it("opens advanced filters when an advanced selection is active", () => {
  const html = renderToStaticMarkup(createElement(InboxFilters, { filters: inboxFilterSchema.parse({ window: "closing" }), members: [], categories: [] }));
  expect(html).toContain('open=""');
  expect(html).toContain("1 activos");
  expect(html).toContain('value="closing" selected=""');
});
