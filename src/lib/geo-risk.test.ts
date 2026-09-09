import { expect, it } from "vitest";
import { distanceMeters, matchingDangerZones } from "./geo-risk";

it("detects a point inside a configured risk radius", () => {
  const point = { latitude: -34.61, longitude: -58.41 };
  expect(matchingDangerZones(point, [{ id: "zone", name: "Prueba", latitude: -34.61, longitude: -58.41, radiusMeters: 200, note: null }])).toHaveLength(1);
});

it("does not flag a point outside the configured radius", () => {
  expect(distanceMeters({ latitude: -34.61, longitude: -58.41 }, { latitude: -34.62, longitude: -58.41 })).toBeGreaterThan(200);
  expect(matchingDangerZones({ latitude: -34.61, longitude: -58.41 }, [{ id: "zone", name: "Prueba", latitude: -34.62, longitude: -58.41, radiusMeters: 200, note: null }])).toHaveLength(0);
});
