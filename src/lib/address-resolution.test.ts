import { describe, expect, it } from "vitest";
import { addressResolutionFromGeoref } from "./address-resolution";

describe("address resolver", () => {
  it("keeps only official normalized fields and never invents a postal code", () => {
    expect(addressResolutionFromGeoref({ nomenclatura: "AV SAN JUAN 3866, Comuna 3, Ciudad Autónoma de Buenos Aires", localidad_censal: { nombre: "Ciudad de Buenos Aires" }, provincia: { nombre: "Ciudad Autónoma de Buenos Aires" }, ubicacion: { lat: -34.61, lon: -58.41 } })).toEqual({ resolved: true, normalizedAddress: "AV SAN JUAN 3866, Comuna 3, Ciudad Autónoma de Buenos Aires", locality: "Ciudad de Buenos Aires", province: "Ciudad Autónoma de Buenos Aires", latitude: -34.61, longitude: -58.41, source: "georef-ar", postalCode: null });
  });

  it("does not turn an unavailable result into a location", () => {
    expect(addressResolutionFromGeoref(undefined)).toEqual({ resolved: false, source: "unresolved", postalCode: null });
  });
});
