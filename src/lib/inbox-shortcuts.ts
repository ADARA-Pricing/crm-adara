import { inboxFilterSchema } from "./inbox-filters";

/** Exclusive view shortcuts: choosing one never accumulates a previous preset. */
export function inboxShortcuts(raw: unknown) {
  const filters = inboxFilterSchema.parse(raw);
  const presets = [
    { label: "Sin responder", changes: { attention: "pending" } },
    { label: "Mis chats", changes: { owner: "mine", window: "open", attention: "human" } },
    { label: "Ventana por vencer", changes: { window: "closing" } },
    { label: "Muy interesados", changes: { stage: "VERY_INTERESTED", window: "open", bought: "no" } },
  ];
  const shortcutKeys = ["owner", "window", "attention", "stage", "bought"] as const;
  const base = { ...filters, owner: "", window: "", attention: "", stage: "", bought: "", sort: "", page: 1 };
  const href = (selection: typeof base) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(selection)) if (value !== "" && key !== "page" && !(key === "sort" && value === "recent")) query.set(key, String(value));
    return query.size ? `/bandeja?${query}` : "/bandeja";
  };
  return presets.map(preset => {
    const active = shortcutKeys.every(key => String(filters[key] || "") === String(preset.changes[key as keyof typeof preset.changes] || ""));
    const selection = active ? base : { ...base, ...preset.changes };
    return { label: preset.label, selection, active, href: href(selection) };
  });
}
