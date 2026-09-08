import { z } from "zod";
export const profileInput = z.object({
  displayName: z.string().trim().min(2, "Usá al menos 2 caracteres.").max(60, "Máximo 60 caracteres."),
  avatarColor: z.enum(["brown", "green", "blue", "purple"]),
});
export function operatorInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join("").toLocaleUpperCase("es-AR") || "?";
}
