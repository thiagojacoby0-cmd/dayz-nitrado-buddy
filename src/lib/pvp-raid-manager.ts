// Gerenciador Central de Zonas de PvP (Combate Liberado vs PvE Protegido) e Controle de Raid de Bases.
// Suporta exportação para init.c vanilla do DayZ (Xbox/PS/PC) e cfggameplay.json.

export type PvpZoneType = "pvp_allowed" | "pve_safe";
export type RaidScheduleType = "always_active" | "weekends_only" | "night_hours" | "disabled";

export interface PvpZone {
  id: string;
  name: string;
  shortName: string;
  type: PvpZoneType; // "pvp_allowed" = PvP Liberado aqui (Fora dela: Dano bloqueado) / "pve_safe" = Safezone
  x: number;
  z: number;
  radius: number; // Raio em metros no mapa
  enabled: boolean;
  schedule: "always" | "weekends" | "nights" | "custom";
  description?: string;
  enterNotification: string;
  exitNotification: string;
  blockBulletDamageOutside: boolean; // Dano de tiros entre jogadores bloqueado fora
  blockMeleeDamageOutside: boolean; // Dano corporal/facas entre jogadores bloqueado fora
  color?: string;
}

export interface BaseRaidConfig {
  raidEnabled: boolean; // Ativar ou Desativar Danos em Bases (Raid)
  scheduleType: RaidScheduleType;
  scheduleDescription?: string;
  weekendStartDay: number; // 5 = Sexta
  weekendStartHour: number; // 18:00
  weekendEndDay: number; // 0 = Domingo
  weekendEndHour: number; // 23:59
  allowExplosives: boolean; // C4, Granadas, M79
  allowBullets: boolean; // Tiros de fuzil e armas pesadas
  allowMeleeTools: boolean; // Marretas, machados, picaretas
  allowHacksawLocks: boolean; // Cortar cadeados com serra
  lockpickDurationSeconds: number; // Tempo para arrombar (ex: 600s = 10 min, 0 = desativado)
  protectOfflineBases: boolean;
  notes?: string;
}

export const PVP_ZONES_STORAGE_KEY = "fronteiraz_pvp_zones_v2";
export const BASE_RAID_STORAGE_KEY = "fronteiraz_base_raid_v2";
export const PVP_RESTRICTED_MODE_STORAGE_KEY = "fronteiraz_pvp_restricted_mode_v2";

// Zonas Táticas Predefinidas de Chernarus com coordenadas precisas
export const DEFAULT_PVP_ZONES: PvpZone[] = [
  {
    id: "pvp-nwaf",
    name: "Aeroporto Militar do Noroeste (NWAF)",
    shortName: "NWAF",
    type: "pvp_allowed",
    x: 4600,
    z: 10400,
    radius: 1300,
    enabled: true,
    schedule: "always",
    description: "Zona Militar Principal de Chernarus. Tiroteio e combate livre 24/7.",
    enterNotification:
      "⚠️ ATENÇÃO: Você entrou na Zona de PVP (NWAF)! O combate está 100% liberado!",
    exitNotification: "🛡️ SEGURO: Você saiu da Zona de PVP! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#ef4444",
  },
  {
    id: "pvp-tisy",
    name: "Base Militar Secreta de Tisy",
    shortName: "Tisy",
    type: "pvp_allowed",
    x: 1600,
    z: 14000,
    radius: 1100,
    enabled: true,
    schedule: "always",
    description: "Instalação secreta de radares e mísseis. Loot militar Tier 4.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP (Tisy)! Zona de combate letal!",
    exitNotification: "🛡️ SEGURO: Você saiu de Tisy! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#dc2626",
  },
  {
    id: "pvp-kamensk",
    name: "Base Militar de Kamensk",
    shortName: "Kamensk",
    type: "pvp_allowed",
    x: 7850,
    z: 14650,
    radius: 800,
    enabled: true,
    schedule: "always",
    description: "Base militar e mina ao norte de Chernarus.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP (Kamensk)! Dano ativado!",
    exitNotification: "🛡️ SEGURO: Você saiu de Kamensk! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#ea580c",
  },
  {
    id: "pvp-balota",
    name: "Aeroporto Costeiro de Balota",
    shortName: "Balota",
    type: "pvp_allowed",
    x: 4950,
    z: 2450,
    radius: 750,
    enabled: true,
    schedule: "always",
    description: "Pista de pouso e barracas militares costeiras ao sul.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP (Balota)! Tiroteio liberado!",
    exitNotification: "🛡️ SEGURO: Você saiu de Balota! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#f59e0b",
  },
  {
    id: "pvp-krasnostav",
    name: "Aeroporto Nordeste (NEAF Krasnostav)",
    shortName: "NEAF",
    type: "pvp_allowed",
    x: 12100,
    z: 12600,
    radius: 850,
    enabled: true,
    schedule: "always",
    description: "Aeroporto secundário de Krasnostav no nordeste.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP (NEAF Krasnostav)!",
    exitNotification: "🛡️ SEGURO: Você saiu de Krasnostav! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#eab308",
  },
  {
    id: "pvp-prison-island",
    name: "Ilha da Prisão (Prigodki Island)",
    shortName: "Prisão",
    type: "pvp_allowed",
    x: 2750,
    z: 1300,
    radius: 650,
    enabled: true,
    schedule: "always",
    description: "Penitenciária isolada no mar de Chernarus.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP da Ilha da Prisão!",
    exitNotification: "🛡️ SEGURO: Você saiu da Ilha da Prisão! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#b91c1c",
  },
  {
    id: "pvp-pavlovo",
    name: "Base Militar de Pavlovo (Zona Contaminada)",
    shortName: "Pavlovo",
    type: "pvp_allowed",
    x: 2200,
    z: 3400,
    radius: 700,
    enabled: true,
    schedule: "always",
    description: "Base militar com gás tóxico permanente. Combate extremo.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP & Gás (Pavlovo)!",
    exitNotification: "🛡️ SEGURO: Você saiu de Pavlovo! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#10b981",
  },
  {
    id: "pvp-staroye",
    name: "Acampamento Militar de Staroye",
    shortName: "Staroye",
    type: "pvp_allowed",
    x: 10150,
    z: 5500,
    radius: 500,
    enabled: true,
    schedule: "always",
    description: "Tendas militares no centro-leste de Chernarus.",
    enterNotification: "⚠️ ATENÇÃO: Você entrou na Zona de PVP (Staroye Tents)!",
    exitNotification: "🛡️ SEGURO: Você saiu de Staroye! Dano entre jogadores DESATIVADO.",
    blockBulletDamageOutside: true,
    blockMeleeDamageOutside: true,
    color: "#84cc16",
  },
];

export const DEFAULT_BASE_RAID_CONFIG: BaseRaidConfig = {
  raidEnabled: false, // Por padrão, raid desativado para segurança
  scheduleType: "weekends_only",
  scheduleDescription: "Raid liberado somente de Sexta 18:00 até Domingo 23:59",
  weekendStartDay: 5,
  weekendStartHour: 18,
  weekendEndDay: 0,
  weekendEndHour: 23,
  allowExplosives: true,
  allowBullets: false,
  allowMeleeTools: false,
  allowHacksawLocks: true,
  lockpickDurationSeconds: 600,
  protectOfflineBases: false,
  notes: "Quando desativado, nenhuma parede, cerca ou portão sofre dano de armas ou explosivos.",
};

export function loadPvpZones(): PvpZone[] {
  try {
    const raw = localStorage.getItem(PVP_ZONES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_PVP_ZONES;
}

export function savePvpZones(zones: PvpZone[]) {
  try {
    localStorage.setItem(PVP_ZONES_STORAGE_KEY, JSON.stringify(zones));
  } catch {
    /* ignore */
  }
}

export function loadPvpRestrictedMode(): boolean {
  try {
    const raw = localStorage.getItem(PVP_RESTRICTED_MODE_STORAGE_KEY);
    return raw !== null ? raw === "true" : true; // Padrão: Modo restrito ativado (PvP somente nas zonas)
  } catch {
    return true;
  }
}

export function savePvpRestrictedMode(enabled: boolean) {
  try {
    localStorage.setItem(PVP_RESTRICTED_MODE_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

export function loadBaseRaidConfig(): BaseRaidConfig {
  try {
    const raw = localStorage.getItem(BASE_RAID_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_BASE_RAID_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_BASE_RAID_CONFIG;
}

export function saveBaseRaidConfig(config: BaseRaidConfig) {
  try {
    localStorage.setItem(BASE_RAID_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

/**
 * Gera o script completo para DayZ `init.c` (compatível com servidores Xbox / PS / PC Vanilla da Nitrado).
 * Desativa dano entre jogadores fora das zonas programadas de PvP e controla o dano de raid em bases!
 */
export function generateInitPvpScript(
  zones: PvpZone[],
  raidConfig: BaseRaidConfig,
  pvpRestricted: boolean,
): string {
  const activePvpZones = zones.filter((z) => z.enabled && z.type === "pvp_allowed");
  const activeSafeZones = zones.filter((z) => z.enabled && z.type === "pve_safe");

  const zonesArrayCode = activePvpZones
    .map(
      (z) =>
        `\t\tPvpZoneDefinition.Create("${z.shortName}", Vector(${z.x}, 0, ${z.z}), ${z.radius}.0)`,
    )
    .join(",\n");

  const safeZonesArrayCode = activeSafeZones
    .map(
      (z) =>
        `\t\tPvpZoneDefinition.Create("${z.shortName}", Vector(${z.x}, 0, ${z.z}), ${z.radius}.0)`,
    )
    .join(",\n");

  return `// ============================================================================
// FRONTEIRA Z - SISTEMA DE PROTEÇÃO PVE / ZONAS DE PVP & CONTROLE DE RAID DE BASES
// Arquivo: init.c (Missão DayZ Offline Chernarus)
// Gerado automaticamente pelo Fronteira Z Editor
// ============================================================================

class PvpZoneDefinition
{
    string m_Name;
    vector m_Center;
    float m_Radius;

    static ref PvpZoneDefinition Create(string name, vector center, float radius)
    {
        PvpZoneDefinition def = new PvpZoneDefinition();
        def.m_Name = name;
        def.m_Center = center;
        def.m_Radius = radius;
        return def;
    }
}

class FronteiraZCombatManager
{
    // CONFIGURAÇÕES GERAIS
    static bool PVP_RESTRICTED_ACTIVE = ${pvpRestricted ? "true" : "false"}; // Se true, tiro em jogador FORA das zonas NÃO causa dano
    static bool BASE_RAID_ACTIVE = ${raidConfig.raidEnabled ? "true" : "false"}; // Controle de Raid de Bases (${raidConfig.raidEnabled ? "RAID ATIVADO" : "RAID DESATIVADO - BASES PROTEGIDAS"})
    static bool RAID_ALLOW_EXPLOSIVES_ONLY = ${raidConfig.allowExplosives && !raidConfig.allowBullets && !raidConfig.allowMeleeTools ? "true" : "false"};

    static ref array<ref PvpZoneDefinition> m_PvpZones;
    static ref array<ref PvpZoneDefinition> m_SafeZones;

    static void Init()
    {
        m_PvpZones = new array<ref PvpZoneDefinition>;
        m_SafeZones = new array<ref PvpZoneDefinition>;

        // ZONAS DE PVP LIBERADO (${activePvpZones.length} zonas programadas)
${zonesArrayCode ? `        m_PvpZones = {\n${zonesArrayCode}\n        };` : "        // Nenhuma zona de PvP cadastrada"}

        // SAFEZONES PVE (${activeSafeZones.length} safezones programadas)
${safeZonesArrayCode ? `        m_SafeZones = {\n${safeZonesArrayCode}\n        };` : "        // Nenhuma safezone cadastrada"}

        Print("[FronteiraZ] Sistema de Zonas de PvP inicializado. PvP Restrito: " + PVP_RESTRICTED_ACTIVE + " | Raid de Bases: " + BASE_RAID_ACTIVE);
    }

    // Verifica se uma posição está dentro de qualquer Zona de PvP liberada
    static bool IsInPvpZone(vector pos)
    {
        if (!m_PvpZones) return true;
        foreach (PvpZoneDefinition zone : m_PvpZones)
        {
            float dist = vector.Distance(Vector(pos[0], 0, pos[2]), Vector(zone.m_Center[0], 0, zone.m_Center[2]));
            if (dist <= zone.m_Radius)
            {
                return true;
            }
        }
        return false;
    }

    // Verifica se uma posição está dentro de uma Safezone PvE
    static bool IsInSafeZone(vector pos)
    {
        if (!m_SafeZones) return false;
        foreach (PvpZoneDefinition safe : m_SafeZones)
        {
            float dist = vector.Distance(Vector(pos[0], 0, safe.m_Center[0]), Vector(safe.m_Center[0], 0, safe.m_Center[2]));
            if (dist <= safe.m_Radius)
            {
                return true;
            }
        }
        return false;
    }

    // Valida se o dano entre dois jogadores é permitido
    // Se atacante ou vítima estiverem FORA da zona de PvP, retorna FALSE (DANO BLOQUEADO)
    static bool CanDamagePlayer(PlayerBase victim, Object source)
    {
        if (!PVP_RESTRICTED_ACTIVE) return true;
        if (!victim) return true;

        PlayerBase attacker = PlayerBase.Cast(source);
        if (!attacker)
        {
            // Se foi dano de tiro/projétil disparado por jogador
            EntityAI entity = EntityAI.Cast(source);
            if (entity)
            {
                attacker = PlayerBase.Cast(entity.GetHierarchyRootPlayer());
            }
        }

        // Se o atacante for outro jogador
        if (attacker && attacker != victim)
        {
            vector victimPos = victim.GetPosition();
            vector attackerPos = attacker.GetPosition();

            // Safezone PvE explícita
            if (IsInSafeZone(victimPos) || IsInSafeZone(attackerPos))
            {
                return false; // Tiro bloqueado em Safezone
            }

            // Se o modo PvP Restrito estiver ativo, AMBOS devem estar na zona de PvP
            bool victimInPvp = IsInPvpZone(victimPos);
            bool attackerInPvp = IsInPvpZone(attackerPos);

            if (!victimInPvp || !attackerInPvp)
            {
                // BLOQUEIA O DANO! Jogadores estão fora da área de combate permitida
                return false;
            }
        }

        return true;
    }

    // Valida se dano em construções de base é permitido (Raid)
    static bool CanDamageBaseStructure(Object target, Object source)
    {
        if (!BASE_RAID_ACTIVE)
        {
            // RAID DESATIVADO: Paredes, cercas, portões e torres são invulneráveis!
            return false;
        }

        return true;
    }
}

// ============================================================================
// Gancho de inicialização no main() do init.c:
// Adicione a chamada 'FronteiraZCombatManager.Init();' dentro de main()
// ============================================================================
`;
}

/**
 * Atualiza o objeto JSON de cfggameplay.json para aplicar as regras de Raid de Bases.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyBaseRaidToGameplayJson(gameplayJson: any, raidEnabled: boolean): any {
  if (!gameplayJson || typeof gameplayJson !== "object") {
    gameplayJson = { version: 124 };
  }

  const updated = { ...gameplayJson };

  // BaseBuildingData no cfggameplay.json
  const baseBuilding =
    updated.BaseBuildingData && typeof updated.BaseBuildingData === "object"
      ? { ...updated.BaseBuildingData }
      : {};

  // damageType: 0 = desativa dano em construções (Raid Desativado)
  // damageType: 1 = ativa dano por explosivos/ferramentas (Raid Ativado)
  baseBuilding.damageType = raidEnabled ? 1 : 0;
  baseBuilding.disableBaseDamage = !raidEnabled;

  const constructionData =
    baseBuilding.ConstructionData && typeof baseBuilding.ConstructionData === "object"
      ? { ...baseBuilding.ConstructionData }
      : {};

  constructionData.disablePerformCheck = false;
  constructionData.disableIsCollidingCheck = false;
  constructionData.disableDistanceCheck = false;

  baseBuilding.ConstructionData = constructionData;
  updated.BaseBuildingData = baseBuilding;

  return updated;
}
