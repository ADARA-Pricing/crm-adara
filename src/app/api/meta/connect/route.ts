import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createMetaState, metaConfiguration } from "@/lib/meta-ads";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdmin();
  try {
    const { appId, redirectUri } = metaConfiguration();
    const url = new URL("https://www.facebook.com/v25.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", createMetaState(user.id));
    url.searchParams.set("response_type", "code");
    // Read-only access: do not add ads_management or publishing permissions.
    url.searchParams.set("scope", "ads_read");
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/marketing?meta=configuration", process.env.META_REDIRECT_URI || "http://localhost:3000"));
  }
}
