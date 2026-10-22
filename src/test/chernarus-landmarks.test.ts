import { describe, expect, it } from "vitest";
import { NOTABLE_BUILDINGS, CHERNARUS_ROADS } from "../lib/chernarus-landmarks";

describe("Chernarus Landmarks & Map Data", () => {
  it("carrega lista canônica de prédios com categorias e coordenadas válidas", () => {
    expect(NOTABLE_BUILDINGS.length).toBeGreaterThanOrEqual(30);

    for (const b of NOTABLE_BUILDINGS) {
      expect(b.id).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.category).toBeTruthy();
      expect(b.city).toBeTruthy();
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(15360);
      expect(b.z).toBeGreaterThanOrEqual(0);
      expect(b.z).toBeLessThanOrEqual(15360);
      expect(b.lootProfile).toBeTruthy();
    }
  });

  it("possui rotas e estradas principais com traçado de coordenadas", () => {
    expect(CHERNARUS_ROADS.length).toBeGreaterThanOrEqual(5);

    const hasHighway = CHERNARUS_ROADS.some((r) => r.type === "Rodovia Principal");
    const hasRailway = CHERNARUS_ROADS.some((r) => r.type === "Linha Férrea (Trem)");
    expect(hasHighway).toBe(true);
    expect(hasRailway).toBe(true);

    for (const r of CHERNARUS_ROADS) {
      expect(r.points.length).toBeGreaterThan(1);
      for (const [px, pz] of r.points) {
        expect(px).toBeGreaterThanOrEqual(0);
        expect(px).toBeLessThanOrEqual(15360);
        expect(pz).toBeGreaterThanOrEqual(0);
        expect(pz).toBeLessThanOrEqual(15360);
      }
    }
  });
});
