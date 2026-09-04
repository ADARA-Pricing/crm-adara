"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    botpress?: {
      init: (options: Record<string, unknown>) => void;
      on: (event: string, callback: () => void) => void;
      open: () => void;
    };
  }
}

const clientId = process.env.NEXT_PUBLIC_BOTPRESS_WEBCHAT_CLIENT_ID;
const botId = process.env.NEXT_PUBLIC_BOTPRESS_BOT_ID || "6a8f4ef2-2d02-4de9-86fb-a9c529b3419f";

export function BotpressSimulator() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !clientId || !window.botpress) return;
    window.botpress.on("webchat:initialized", () => window.botpress?.open());
    window.botpress.init({ botId, clientId });
  }, [ready]);

  if (!clientId) {
    return <section className="simulator-empty"><strong>Falta conectar Webchat</strong><p>Copiá el <em>Client ID</em> de Botpress en Webchat → Deploy Settings y cargalo como <code>NEXT_PUBLIC_BOTPRESS_WEBCHAT_CLIENT_ID</code> en Vercel. Es un identificador público, no una contraseña.</p></section>;
  }

  return <section className="simulator-chat">
    <Script src="https://cdn.botpress.cloud/webchat/v3.3/inject.js" strategy="afterInteractive" onLoad={() => setReady(true)} />
    <div id="webchat-container" />
  </section>;
}
