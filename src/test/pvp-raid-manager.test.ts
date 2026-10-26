import { describe, expect, it } from "vitest";
import {
  DEFAULT_PVP_ZONES,
  DEFAULT_BASE_RAID_CONFIG,
  generateInitPvpScript,
  applyBaseRaidToGameplayJson,
  type PvpZone,
  type BaseRaidConfig,
} from "@/lib/pvp-raid-manager";
import { getItemLabel, DAYZ_ITEM_TRANSLATIONS } from "@/lib/item-translations";

describe("pvp-raid-manager", () => {
  it("should have pre-configured default PvP zones for Chernarus", () => {
    expect(DEFAULT_PVP_ZONES.length).toBeGreaterThanOrEqual(8);
    const nwaf = DEFAULT_PVP_ZONES.find((z) => z.shortName === "NWAF");
    expect(nwaf).toBeDefined();
    expect(nwaf?.x).toBe(4600);
    expect(nwaf?.z).toBe(10400);
    expect(nwaf?.radius).toBeGreaterThanOrEqual(1000);
  });

  it("should generate clean, valid init.c script with PvP zone coordinates and Raid logic", () => {
    const zones: PvpZone[] = [
      {
        id: "test-nwaf",
        name: "NWAF Test",
        shortName: "NWAF",
        type: "pvp_allowed",
        x: 4600,
        z: 10400,
        radius: 1200,
        enabled: true,
        schedule: "always",
        enterNotification: "Entrou no PvP",
        exitNotification: "Saiu do PvP",
        blockBulletDamageOutside: true,
        blockMeleeDamageOutside: true,
      },
    ];

    const raidConfig: BaseRaidConfig = {
      ...DEFAULT_BASE_RAID_CONFIG,
      raidEnabled: true,
      allowExplosives: true,
      allowBullets: false,
      allowMeleeTools: false,
    };

    const script = generateInitPvpScript(zones, raidConfig, true);
    expect(script).toContain("class FronteiraZCombatManager");
    expect(script).toContain("PVP_RESTRICTED_ACTIVE = true");
    expect(script).toContain("BASE_RAID_ACTIVE = true");
    expect(script).toContain('PvpZoneDefinition.Create("NWAF", Vector(4600, 0, 10400), 1200.0)');
    expect(script).toContain("CanDamagePlayer");
    expect(script).toContain("CanDamageBaseStructure");
  });

  it("should update cfggameplay.json correctly when toggling base raid", () => {
    const original = { version: 124 };
    const enabled = applyBaseRaidToGameplayJson(original, true);
    expect(enabled.BaseBuildingData.damageType).toBe(1);
    expect(enabled.BaseBuildingData.disableBaseDamage).toBe(false);

    const disabled = applyBaseRaidToGameplayJson(enabled, false);
    expect(disabled.BaseBuildingData.damageType).toBe(0);
    expect(disabled.BaseBuildingData.disableBaseDamage).toBe(true);
  });
});

describe("item-translations", () => {
  it("should translate core DayZ weapons, magazines, medical, and base building items", () => {
    expect(getItemLabel("M4A1")).toContain("M4A1");
    expect(getItemLabel("M4A1")).toContain("Assalto");
    expect(getItemLabel("AKM")).toContain("AKM");
    expect(getItemLabel("BandageDressing")).toContain("Curativo");
    expect(getItemLabel("TetracyclineAntibiotics")).toContain("Tetraciclina");
    expect(getItemLabel("Plastic_Explosive")).toContain("Explosivo Plástico C4");
    expect(getItemLabel("FenceKit")).toContain("Kit de Construção de Cerca");
    expect(getItemLabel("CombinationLock4")).toContain("Cadeado");
    expect(getItemLabel("CarBattery")).toContain("Bateria");
    expect(getItemLabel("PlateCarrierVest")).toContain("Plate Carrier");
  });

  it("should handle dynamic prefixes and color suffixes for unlisted/modded items", () => {
    const translatedAmmo = getItemLabel("Ammo_338Lapua");
    expect(translatedAmmo).toContain("Munição");

    const translatedMag = getItemLabel("Mag_Custom_50Rnd");
    expect(translatedMag).toContain("Carregador");

    const coloredItem = getItemLabel("TacticalJacket_Black");
    expect(coloredItem).toContain("(Preto)");
  });
});
