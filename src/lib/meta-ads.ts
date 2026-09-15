import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const graphVersion = () => process.env.META_GRAPH_API_VERSION || "v25.0";
export const graphUrl = (path: string) => `https://graph.facebook.com/${graphVersion()}/${path.replace(/^\//, "")}`;

type State = { userId: string; exp: number; nonce: string };

function key() {
  const encoded = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Falta META_TOKEN_ENCRYPTION_KEY.");
  const value = Buffer.from(encoded, "base64");
  if (value.length !== 32) throw new Error("META_TOKEN_ENCRYPTION_KEY debe tener 32 bytes en base64.");
  return value;
}

function encode(value: Buffer) { return value.toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url"); }

export function encryptMetaToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(encrypted)}`;
}

export function decryptMetaToken(value: string) {
  const [ivEncoded, tagEncoded, encryptedEncoded] = value.split(".");
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error("Token de Meta inválido.");
  const decipher = createDecipheriv("aes-256-gcm", key(), decode(ivEncoded));
  decipher.setAuthTag(decode(tagEncoded));
  return Buffer.concat([decipher.update(decode(encryptedEncoded)), decipher.final()]).toString("utf8");
}

function stateSignature(payload: string) { return createHmac("sha256", key()).update(payload).digest(); }

export function createMetaState(userId: string) {
  const state: State = { userId, exp: Date.now() + 10 * 60_000, nonce: encode(randomBytes(16)) };
  const payload = encode(Buffer.from(JSON.stringify(state)));
  return `${payload}.${encode(stateSignature(payload))}`;
}

export function readMetaState(value: string): State | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = stateSignature(payload);
  const received = decode(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const state = JSON.parse(decode(payload).toString("utf8")) as State;
    return state.userId && state.exp > Date.now() ? state : null;
  } catch { return null; }
}

export function metaConfiguration() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) throw new Error("Faltan variables de configuración de Meta Ads.");
  return { appId, appSecret, redirectUri };
}

type ActionValue = { action_type?: string; value?: string };
type InsightsReply = { data?: Array<{ campaign_id?: string; campaign_name?: string; spend?: string; impressions?: string; reach?: string; clicks?: string; actions?: ActionValue[]; purchase_roas?: ActionValue[] }>; error?: { message?: string } };

const reportedValue = (values: ActionValue[] | undefined, actionTypes: string[]) => {
  for (const actionType of actionTypes) {
    const value = values?.find(item => item.action_type === actionType)?.value;
    if (value !== undefined) return value;
  }
  return null;
};

export async function readMetaAccountInsights() {
  const connection = await prisma.metaAdsConnection.findUnique({ where: { id: "primary" } });
  if (!connection) return { connection: null, insights: null, error: null };
  try {
    const token = decryptMetaToken(connection.accessTokenCipher);
    const query = new URLSearchParams({ date_preset: "last_30d", level: "account", fields: "spend,impressions,reach,clicks", access_token: token });
    const response = await fetch(`${graphUrl(`act_${connection.adAccountId}/insights`)}?${query.toString()}`, { cache: "no-store" });
    const payload = await response.json() as InsightsReply;
    if (!response.ok || !payload.data?.[0]) return { connection, insights: null, error: payload.error?.message || "Meta no devolvió métricas para este período." };
    const item = payload.data[0];
    const campaignQuery = new URLSearchParams({ date_preset: "last_30d", level: "campaign", limit: "100", fields: "campaign_id,campaign_name,spend,impressions,reach,clicks,actions,purchase_roas", access_token: token });
    const campaignResponse = await fetch(`${graphUrl(`act_${connection.adAccountId}/insights`)}?${campaignQuery.toString()}`, { cache: "no-store" });
    const campaignPayload = await campaignResponse.json() as InsightsReply;
    const campaigns = campaignResponse.ok ? (campaignPayload.data || []).map(campaign => ({
      id: campaign.campaign_id || campaign.campaign_name || crypto.randomUUID(),
      name: campaign.campaign_name || "Campaña sin nombre",
      spend: campaign.spend || "0",
      reach: campaign.reach || "0",
      impressions: campaign.impressions || "0",
      clicks: campaign.clicks || "0",
      purchases: reportedValue(campaign.actions, ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"]),
      roas: reportedValue(campaign.purchase_roas, ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"])
    })).sort((a, b) => Number(b.spend) - Number(a.spend)) : [];
    return { connection, insights: { spend: item.spend || "0", impressions: item.impressions || "0", reach: item.reach || "0", clicks: item.clicks || "0", campaigns }, error: null };
  } catch {
    return { connection, insights: null, error: "No se pudieron consultar las métricas de Meta. Reconectá la cuenta si el acceso venció." };
  }
}
