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
  postalCode: null;
};

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
    return addressResolutionFromGeoref(data.direcciones?.[0]);
  } catch {
    return { resolved: false, source: "unresolved", postalCode: null };
  } finally {
    clearTimeout(timeout);
  }
}
