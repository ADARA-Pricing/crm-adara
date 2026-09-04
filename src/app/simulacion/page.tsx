import { BotpressSimulator } from "@/components/botpress-simulator";
import { CrmShell } from "@/components/crm-shell";

export default function SimulationPage() {
  return <CrmShell active="/simulacion"><header className="topbar"><div><p className="eyebrow">Entorno de prueba</p><h1>Simulación de conversación</h1><p className="topbar-copy">Probá respuestas, objeciones, precio, retiro y coordinación de entrega como si fueras un cliente.</p></div></header>
    <section className="simulation-notice"><strong>Importante: este chat utiliza el bot publicado.</strong><span>Podés probar consultas libremente. No confirmes un pedido completo durante la prueba: una confirmación explícita crea un pedido pendiente de revisión en el CRM.</span></section>
    <BotpressSimulator />
  </CrmShell>;
}
