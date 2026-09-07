import "server-only";
import { unstable_cache } from "next/cache";
import { analyticsSchema } from "./bot-analytics";
import agentConfig from "../../botpress-agent/agent.json";

// Authentication is checked by the page before entering this server-only shared cache.
const fetchAnalytics = unstable_cache(async (botId: string, workspaceId: string, start: string, end: string) => {
  const token = process.env.BOTPRESS_API_TOKEN?.trim();
  if (!token) throw new Error("missing-config");
  // The live endpoint requires different calendar dates, even for a single day.
  // Request the following midnight and exclude any bucket starting at that boundary.
  const endExclusive = new Date(Date.parse(end) + 1).toISOString();
  const query = new URLSearchParams({ startDate: start, endDate: endExclusive });
  const response = await fetch(`https://api.botpress.cloud/v1/admin/bots/${encodeURIComponent(botId)}/analytics?${query}`, {
    headers: { Authorization: `Bearer ${token}`, "x-workspace-id": workspaceId },
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`upstream-${response.status}`);
  const parsed = analyticsSchema.parse(await response.json());
  return { records: parsed.records.filter(r => Date.parse(r.startDateTimeUtc) >= Date.parse(start) && Date.parse(r.startDateTimeUtc) < Date.parse(endExclusive)), syncedAt: new Date().toISOString() };
}, ["bot-analytics-v2"], { revalidate: 300 });

export async function getBotAnalytics(start: string, end: string) {
  const botId = process.env.BOTPRESS_BOT_ID?.trim();
  const workspaceId = process.env.BOTPRESS_WORKSPACE_ID?.trim() || (botId === agentConfig.botId ? agentConfig.workspaceId : undefined);
  if (!botId || !workspaceId || !process.env.BOTPRESS_API_TOKEN?.trim()) {
    return { error: "Falta configurar la conexión de estadísticas de Botpress." } as const;
  }
  try { return await fetchAnalytics(botId, workspaceId, start, end); }
  catch { return { error: "No se pudieron consultar las estadísticas de Botpress. Puede ser un problema de conexión o permisos. No se muestran ceros en lugar de datos faltantes." } as const; }
}
