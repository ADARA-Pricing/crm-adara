const labels: Record<string, string> = {
  ram: "RAM", storage: "Almacenamiento", display: "Pantalla", battery: "Batería", color: "Color",
  camera: "Cámara", cameras: "Cámaras", processor: "Procesador", operatingSystem: "Sistema operativo",
  os: "Sistema operativo", nfc: "NFC", sim: "SIM", esim: "eSIM", network: "Red", connectivity: "Conectividad"
};

export type ProductTechnicalSpec = { label: string; value: string };

function clean(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  // Template and HTML-entity fragments are not verified product data.
  return text && !/(?:&#\d+;|&#x[\da-f]+;|\{\{[^}]+\}\}|\$\{[^}]+\})/i.test(text) ? text : null;
}

export function productTechnicalSpecs(value: unknown): ProductTechnicalSpec[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, raw]) => {
    const item = clean(raw);
    const label = clean(key);
    return item && label ? [{ label: labels[key] || label, value: item }] : [];
  });
}
