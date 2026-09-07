import { inboxFilterSchema } from "./inbox-filters";

/** View-only shortcuts. Preserve unrelated filters and reset the selected chat/page. */
export function inboxShortcuts(raw: unknown) {
  const filters = inboxFilterSchema.parse(raw);
  const presets = [
    { label: "Mis chats", changes: { owner: "mine", window: "open", attention: "human" } },
    { label: "Ventana por vencer", changes: { window: "closing" } },
    { label: "Muy interesados", changes: { stage: "VERY_INTERESTED", window: "open", bought: "no" } },
    { label: "Sin respuesta", changes: { attention: "pending" } }
  ];
  return presets.map(preset => {
    const selection = { ...filters, ...preset.changes, page: 1 };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(selection)) if (value !== "" && key !== "page") query.set(key, String(value));
    return { label: preset.label, selection, href: `/bandeja?${query}` };
  });
}
