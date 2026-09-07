import { CrmShell } from "@/components/crm-shell";

const content: Record<string, { eyebrow: string; title: string; detail: string }> = {
  entregas: { eyebrow: "Operación", title: "Entregas", detail: "Acá se organizarán los pedidos aprobados por zona, cadete, rango horario y estado de entrega." },
  bandeja: { eyebrow: "Atención", title: "Bandeja WhatsApp", detail: "Mostrará la conversación junto a la ficha del cliente, sus pedidos y las próximas acciones. Se conecta cuando terminemos la integración de WhatsApp." },
  seguimientos: { eyebrow: "Atención", title: "Seguimientos", detail: "Confirmaciones, recordatorios y recupero de consultas sin pedido, siempre con reglas y consentimiento claros." },
  categorías: { eyebrow: "Catálogo", title: "Categorías", detail: "Servirán para organizar celulares, accesorios y futuras líneas B2C o B2B." },
  zonas: { eyebrow: "Catálogo", title: "Zonas de entrega", detail: "Base de cobertura de mensajería privada por localidad y código postal, más controles internos de entrega segura." },
  reportes: { eyebrow: "Gestión", title: "Reportes", detail: "Conversión de chats, pedidos, cancelaciones, entregas y desempeño por zona o campaña." },
  configuración: { eyebrow: "Gestión", title: "Configuración", detail: "Canales, usuarios, reglas de atención y parámetros operativos del CRM." }
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = content[section] || { eyebrow: "CRM Adara", title: "Sección no encontrada", detail: "Elegí una de las secciones disponibles en el menú." };
  return <CrmShell active={`/${section}`}><header className="topbar"><div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="topbar-copy">{page.detail}</p></div></header><section className="panel"><h3>Próxima etapa</h3><p>La base de esta sección se suma después de dejar cerrados Productos, Clientes y Pedidos. Así evitamos menús vacíos que no resuelven trabajo real.</p></section></CrmShell>;
}
