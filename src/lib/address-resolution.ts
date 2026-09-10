export type GeorefAddress = {
  nomenclatura?: string;
  localidad_censal?: { nombre?: string | null } | null;
  provincia?: { nombre?: string | null } | null;
  ubicacion?: { lat?: number | null; lon?: number | null } | null;
};

export type AddressResolution = {
  resolved: boolean;
  normalizedAddress?: string;
  locality?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  source: "georef-ar" | "unresolved";
  postalCode: string | null;
};

function normalizedPostalCode(value: unknown) {
  if (typeof value !== "string") return null;
  const postalCode = value.trim().toUpperCase().replace(/\s+/g, "");
  // Argentine CPA: province letter + four digits + optional three block letters.
  return /^[A-Z]\d{4}(?:[A-Z]{3})?$/.test(postalCode) || /^\d{4}$/.test(postalCode) ? postalCode : null;
}

export async function postalCodeFromCoordinates(latitude?: number, longitude?: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const query = new URLSearchParams({ format: "jsonv2", lat: String(latitude), lon: String(longitude), addressdetails: "1" });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "ADARA-CRM/1.0 (logistica@adaragroup.com.ar)" },
    });
    if (!response.ok) return null;
    const data = await response.json() as { address?: { postcode?: unknown } };
    return normalizedPostalCode(data.address?.postcode);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function addressResolutionFromGeoref(address: GeorefAddress | undefined): AddressResolution {
  const normalizedAddress = address?.nomenclatura?.trim();
  const locality = address?.localidad_censal?.nombre?.trim();
  const province = address?.provincia?.nombre?.trim();
  const latitude = address?.ubicacion?.lat;
  const longitude = address?.ubicacion?.lon;
  if (!normalizedAddress && !locality && !province) return { resolved: false, source: "unresolved", postalCode: null };
  return {
    resolved: true,
    normalizedAddress,
    locality,
    province,
    ...(typeof latitude === "number" ? { latitude } : {}),
    ...(typeof longitude === "number" ? { longitude } : {}),
    source: "georef-ar",
    // GeoRef normalizes streets and territorial units, but does not provide a postal code.
    postalCode: null
  };
}

export async function resolveArgentineAddress(address: string, locality?: string): Promise<AddressResolution> {
  const query = new URLSearchParams({ direccion: address, max: "1" });
  if (locality?.trim()) query.set("localidad", locality.trim());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(`https://apis.datos.gob.ar/georef/api/direcciones?${query}`, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) return { resolved: false, source: "unresolved", postalCode: null };
    const data = await response.json() as { direcciones?: GeorefAddress[] };
    const resolved = addressResolutionFromGeoref(data.direcciones?.[0]);
    if (!resolved.resolved) return resolved;
    return { ...resolved, postalCode: await postalCodeFromCoordinates(resolved.latitude, resolved.longitude) };
  } catch {
    return { resolved: false, source: "unresolved", postalCode: null };
  } finally {
    clearTimeout(timeout);
  }
}
