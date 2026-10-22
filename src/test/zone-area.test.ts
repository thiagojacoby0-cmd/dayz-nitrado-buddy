import { describe, expect, it } from "vitest";

describe("Military Zone Area & Radius Calculations", () => {
  it("calculates area in km² and hectares correctly from radius", () => {
    const radiusMeters = 1000;
    const areaKm2 = +(Math.PI * Math.pow(radiusMeters / 1000, 2)).toFixed(2);
    const areaHectares = Math.round((Math.PI * Math.pow(radiusMeters, 2)) / 10000);

    expect(areaKm2).toBe(3.14);
    expect(areaHectares).toBe(314);
  });

  it("clamps radius between 50m and 10000m", () => {
    const clampRadius = (r: number) => Math.max(50, Math.min(10000, Math.round(r)));

    expect(clampRadius(20)).toBe(50);
    expect(clampRadius(15000)).toBe(10000);
    expect(clampRadius(1250.4)).toBe(1250);
  });

  it("calculates XML zone export string with updated radius", () => {
    const zone = {
      id: "tisy",
      name: "Zona Militar de Tisy",
      tier: "Tier 4",
      x: 1650,
      z: 14350,
      radius: 1800,
    };
    const xml = `<zone name="${zone.id}" smin="1" smax="3" dmin="1" dmax="5" x="${zone.x}.0" z="${zone.z}.0" r="${zone.radius}.0" />`;

    expect(xml).toContain('r="1800.0"');
    expect(xml).toContain('name="tisy"');
  });
});
