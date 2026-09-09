export type GeoPoint = { latitude: number; longitude: number };
export type DangerZonePoint = GeoPoint & { id: string; name: string; radiusMeters: number; note: string | null };

export function distanceMeters(from: GeoPoint, to: GeoPoint) {
  const radius = 6_371_000;
  const radians = (value: number) => value * Math.PI / 180;
  const lat = radians(to.latitude - from.latitude);
  const lon = radians(to.longitude - from.longitude);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(lon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchingDangerZones(point: GeoPoint | null, zones: DangerZonePoint[]) {
  if (!point) return [];
  return zones.filter(zone => distanceMeters(point, zone) <= zone.radiusMeters);
}
