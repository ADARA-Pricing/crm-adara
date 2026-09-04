import { formatArs, getHumanSupportSchedule, getPickupSchedule, LOCAL_ADDRESS, PRODUCT } from "@/lib/sales-policy";

const cards = [
  ["Pedidos para revisar", "0", "Se completará cuando conectemos Supabase."],
  ["Entrega Flex", formatArs(700_000), "Costo fijo para este canal."],
  ["Atención humana", getHumanSupportSchedule(), "Derivación desde el bot."],
  ["Retiro en local", LOCAL_ADDRESS, getPickupSchedule()]
];

export default function Home() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px", fontFamily: "Arial, sans-serif", color: "#221b18" }}>
      <p style={{ color: "#8c5d2e", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>CRM Adara</p>
      <h1 style={{ fontSize: 40, margin: "8px 0" }}>Operación de ventas por WhatsApp</h1>
      <p style={{ fontSize: 18, maxWidth: 680, lineHeight: 1.5 }}>
        Primera campaña: {PRODUCT.name} · {formatArs(PRODUCT.priceCents)} · validación previa antes de logística.
      </p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginTop: 32 }}>
        {cards.map(([title, value, detail]) => (
          <article key={title} style={{ border: "1px solid #e8ddd1", borderRadius: 16, padding: 20, background: "#fffaf5" }}>
            <p style={{ margin: 0, color: "#745e4a", fontSize: 14 }}>{title}</p>
            <strong style={{ display: "block", fontSize: 22, margin: "10px 0" }}>{value}</strong>
            <small style={{ color: "#745e4a", lineHeight: 1.4 }}>{detail}</small>
          </article>
        ))}
      </section>
      <section style={{ marginTop: 32, borderRadius: 16, padding: 24, background: "#2b2018", color: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Flujo de pedido</h2>
        <p style={{ marginBottom: 0 }}>Datos del cliente → confirmación explícita → revisión comercial y de riesgo → logística → entrega.</p>
      </section>
    </main>
  );
}
