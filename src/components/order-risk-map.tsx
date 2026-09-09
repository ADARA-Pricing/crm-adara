"use client";

import { useMemo } from "react";
import type { DangerZonePoint, GeoPoint } from "@/lib/geo-risk";

type Props = { point: GeoPoint | null; address: string; zones: DangerZonePoint[]; matches: DangerZonePoint[] };
const metersPerDegreeLat = 111_320;
const metersPerDegreeLon = (latitude: number) => Math.max(1, metersPerDegreeLat * Math.cos(latitude * Math.PI / 180));

export function OrderRiskMap({ point, address, zones, matches }: Props) {
  const bounds = useMemo(() => {
    if (!point) return null;
    const all = [point, ...zones];
    const padding = Math.max(700, ...zones.map(zone => zone.radiusMeters * 1.5));
    const minLat = Math.min(...all.map(item => item.latitude)) - padding / metersPerDegreeLat;
    const maxLat = Math.max(...all.map(item => item.latitude)) + padding / metersPerDegreeLat;
    const minLon = Math.min(...all.map(item => item.longitude)) - padding / metersPerDegreeLon(point.latitude);
    const maxLon = Math.max(...all.map(item => item.longitude)) + padding / metersPerDegreeLon(point.latitude);
    return { minLat, maxLat, minLon, maxLon };
  }, [point, zones]);
  if (!point || !bounds) return <section className="risk-map empty"><h2>Mapa de seguridad</h2><p>No pudimos ubicar con suficiente precisión esta dirección. Verificá manualmente antes de aprobar.</p></section>;
  const x = (longitude: number) => ((longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
  const y = (latitude: number) => (1 - (latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  const radius = (zone: DangerZonePoint) => Math.max(2, (zone.radiusMeters / metersPerDegreeLat) / (bounds.maxLat - bounds.minLat) * 100);
  const bbox = `${bounds.minLon},${bounds.minLat},${bounds.maxLon},${bounds.maxLat}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.latitude},${point.longitude}`)}`;
  return <section className="risk-map panel"><div className="risk-map-heading"><div><h2>Mapa de seguridad</h2><p>{address}</p></div><a href={mapsUrl} target="_blank" rel="noreferrer">Abrir en Maps</a></div>
    <div className="risk-map-canvas" aria-label="Ubicación del pedido y zonas de riesgo"><iframe title="Mapa de ubicación" src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${point.latitude}%2C${point.longitude}`}/><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{zones.map(zone => <circle key={zone.id} cx={x(zone.longitude)} cy={y(zone.latitude)} r={radius(zone)} className="danger-zone-circle"><title>{zone.name}</title></circle>)}<circle cx={x(point.longitude)} cy={y(point.latitude)} r="1.8" className="order-point"/></svg></div>
    <p className={matches.length ? "risk-match" : "risk-clear"}>{matches.length ? `Atención: la ubicación cae dentro de ${matches.map(zone => `“${zone.name}”`).join(", ")}. Revisá las condiciones antes de aprobar.` : zones.length ? "La ubicación no cae dentro de las zonas de riesgo activas cargadas." : "Todavía no hay zonas de riesgo cargadas."}</p>
    {matches.map(zone => zone.note && <p className="risk-note" key={zone.id}>{zone.name}: {zone.note}</p>)}</section>;
}
