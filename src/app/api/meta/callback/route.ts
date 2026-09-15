import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptMetaToken, graphUrl, metaConfiguration, readMetaState } from "@/lib/meta-ads";

export const runtime = "nodejs";

type TokenReply = { access_token?: string; expires_in?: number; error?: { message?: string } };
type AccountReply = { id?: string; account_id?: string; name?: string; error?: { message?: string } };

const returnToMarketing = (request: Request, result: string) => NextResponse.redirect(new URL(`/marketing?meta=${result}`, request.url));

export async function GET(request: Request) {
  const user = await requireAdmin();
  const params = new URL(request.url).searchParams;
  const state = readMetaState(params.get("state") || "");
  if (!state || state.userId !== user.id || !params.get("code")) return returnToMarketing(request, "denied");
  try {
    const { appId, appSecret, redirectUri } = metaConfiguration();
    const tokenUrl = new URL(graphUrl("oauth/access_token"));
    tokenUrl.search = new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code: params.get("code")! }).toString();
    const initial = await fetch(tokenUrl, { cache: "no-store" }).then(async response => ({ ok: response.ok, body: await response.json() as TokenReply }));
    if (!initial.ok || !initial.body.access_token) throw new Error(initial.body.error?.message || "No se recibió un token de Meta.");

    const longLivedUrl = new URL(graphUrl("oauth/access_token"));
    longLivedUrl.search = new URLSearchParams({ grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: initial.body.access_token }).toString();
    const extended = await fetch(longLivedUrl, { cache: "no-store" }).then(async response => ({ ok: response.ok, body: await response.json() as TokenReply }));
    const token = extended.ok && extended.body.access_token ? extended.body.access_token : initial.body.access_token;
    const expiresIn = extended.ok ? extended.body.expires_in : initial.body.expires_in;

    const configuredAccount = process.env.META_AD_ACCOUNT_ID?.replace(/^act_/, "");
    if (!configuredAccount) throw new Error("Falta META_AD_ACCOUNT_ID.");
    const accountResponse = await fetch(`${graphUrl(`act_${configuredAccount}`)}?fields=id,account_id,name,account_status,currency&access_token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const account = await accountResponse.json() as AccountReply;
    if (!accountResponse.ok || !account.id) throw new Error(account.error?.message || "No se pudo leer la cuenta publicitaria configurada.");

    await prisma.metaAdsConnection.upsert({
      where: { id: "primary" },
      create: { id: "primary", adAccountId: account.account_id || configuredAccount, adAccountName: account.name || null, accessTokenCipher: encryptMetaToken(token), tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null, connectedById: user.id },
      update: { adAccountId: account.account_id || configuredAccount, adAccountName: account.name || null, accessTokenCipher: encryptMetaToken(token), tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null, connectedById: user.id, connectedAt: new Date() }
    });
    return returnToMarketing(request, "connected");
  } catch (error) {
    console.error("Meta Ads OAuth callback failed", error);
    return returnToMarketing(request, "error");
  }
}
