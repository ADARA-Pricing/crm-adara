"use client";

import Script from "next/script";
import { useState } from "react";
import { usePathname } from "next/navigation";

const injectUrl = "https://cdn.botpress.cloud/webchat/v3.7/inject.js";
const configurationUrl = "https://files.bpcontent.cloud/2026/09/04/16/20260904161245-E5UNHYVY.js";

export function BotpressWebchat() {
  const [injectLoaded, setInjectLoaded] = useState(false);
  const pathname = usePathname();
  const operationalRoute = ["/", "/bandeja", "/embudo", "/tareas", "/pedidos", "/logistica", "/bot", "/resultados"].some(route => route === "/" ? pathname === route : pathname === route || pathname.startsWith(`${route}/`));

  if (operationalRoute) return null;
  return <>
    <Script src={injectUrl} strategy="afterInteractive" onLoad={() => setInjectLoaded(true)} />
    {injectLoaded ? <Script src={configurationUrl} strategy="afterInteractive" /> : null}
  </>;
}
