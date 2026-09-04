"use client";

import Script from "next/script";
import { useState } from "react";

const injectUrl = "https://cdn.botpress.cloud/webchat/v3.7/inject.js";
const configurationUrl = "https://files.bpcontent.cloud/2026/09/04/16/20260904161245-E5UNHYVY.js";

export function BotpressSimulator() {
  const [injectLoaded, setInjectLoaded] = useState(false);

  return <section className="simulator-chat">
    <div id="webchat-container" />
    <Script src={injectUrl} strategy="afterInteractive" onLoad={() => setInjectLoaded(true)} />
    {injectLoaded ? <Script src={configurationUrl} strategy="afterInteractive" /> : null}
  </section>;
}
