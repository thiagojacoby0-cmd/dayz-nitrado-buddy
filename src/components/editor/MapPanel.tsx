import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import mapImg from "@/assets/map-chernarus.jpg";
import mapImgSat from "@/assets/map-chernarus-sat.jpg";
import {
  ShieldAlert,
  Crosshair,
  MapPin,
  AlertTriangle,
  Copy,
  Plus,
  Compass,
  Radio,
  Flame,
  Search,
  Check,
  Building2,
  Skull,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  LocateFixed,
  CircleDot,
  FileCode,
  Shield,
  ShieldCheck,
  Percent,
  SlidersHorizontal,
  Trash2,
  Ruler,
  Swords,
  Bomb,
  Download,
  Zap,
} from "lucide-react";
import { getItemLabel } from "@/lib/demo-data";
import {
  type PvpZone,
  type BaseRaidConfig,
  loadPvpZones,
  savePvpZones,
  loadPvpRestrictedMode,
  savePvpRestrictedMode,
  loadBaseRaidConfig,
  saveBaseRaidConfig,
  generateInitPvpScript,
  DEFAULT_PVP_ZONES,
} from "@/lib/pvp-raid-manager";

type MilitaryTier = "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4" | "Zona Tóxica (Tier 4)";

type MilitaryZoneType =
  | "Complexo Militar Principal"
  | "Aeroporto Militar"
  | "Zona de Contaminação Tóxica (NBC)"
  | "Acampamento Militar de Tendas"
  | "Posto Avançado de Bloqueio"
  | "Instalação Estratégica & Radar";

interface ZoneLootItem {
  id: string;
  name: string;
  chance: number; // Porcentagem de 1 a 100
}

interface MilitaryZone {
  id: string;
  name: string;
  shortName: string;
  x: number;
  z: number;
  radius: number; // Raio da zona em metros no Chernarus
  tier: MilitaryTier;
  zoneType: MilitaryZoneType;
  description: string;
  keyLoot: string[];
  structures: string[];
  pvpDanger: "Extremo (PVP Constante)" | "Alto Risco" | "Moderado" | "Zona Tóxica Letal";
  hazards?: string;
  nbcRequired?: boolean;
  heliCrashChance?: "Alta" | "Média" | "Baixa" | "Nenhuma";
  convoyChance?: "Alta" | "Média" | "Baixa";
  featured?: boolean;
}

const DEFAULT_ZONE_LOOT_STORAGE_KEY = "dayz-zone-loot-chances";
const DEFAULT_ZONE_RADIUS_STORAGE_KEY = "dayz-zone-radius-overrides";

function getDefaultZoneLoot(zone: MilitaryZone): ZoneLootItem[] {
  return zone.keyLoot.map((item, idx) => {
    let defaultChance = 35;
    const lower = item.toLowerCase();
    const isT4orGas = zone.tier.includes("Zona Tóxica") || zone.tier === "Tier 4";

    if (
      lower.includes("lar") ||
      lower.includes("fal") ||
      lower.includes("vsd") ||
      lower.includes("vss") ||
      lower.includes("sval")
    ) {
      defaultChance = isT4orGas ? 12 : 6;
    } else if (lower.includes("m4a1") || lower.includes("dmr")) {
      defaultChance = isT4orGas ? 18 : 10;
    } else if (lower.includes("nvg") || lower.includes("noturna") || lower.includes("supressor")) {
      defaultChance = isT4orGas ? 15 : 8;
    } else if (lower.includes("mina") || lower.includes("granada")) {
      defaultChance = 20;
    } else if (lower.includes("placa") || lower.includes("balístico") || lower.includes("colete")) {
      defaultChance = isT4orGas ? 30 : 25;
    } else if (lower.includes("akm") || lower.includes("ka-74") || lower.includes("m16")) {
      defaultChance = 35;
    } else if (
      lower.includes("pioneer") ||
      lower.includes("sg5") ||
      lower.includes("sks") ||
      lower.includes("escopeta")
    ) {
      defaultChance = 45;
    } else if (
      lower.includes("pistola") ||
      lower.includes("submetralhadora") ||
      lower.includes("capacete")
    ) {
      defaultChance = 60;
    } else if (
      lower.includes("muniç") ||
      lower.includes("kit") ||
      lower.includes("soro") ||
      lower.includes("farda") ||
      lower.includes("mochila") ||
      lower.includes("bandagem") ||
      lower.includes("comida") ||
      lower.includes("cantil")
    ) {
      defaultChance = 65;
    } else {
      defaultChance =
        zone.tier === "Tier 1"
          ? 65
          : zone.tier === "Tier 2"
            ? 50
            : zone.tier === "Tier 3"
              ? 35
              : 20;
    }

    return {
      id: `${zone.id}-${idx}`,
      name: item,
      chance: defaultChance,
    };
  });
}

const MILITARY_ZONES: MilitaryZone[] = [
  {
    id: "tisy",
    name: "Zona Militar de Tisy",
    shortName: "Tisy Militar",
    x: 1650,
    z: 14350,
    radius: 1250,
    tier: "Tier 4",
    zoneType: "Complexo Militar Principal",
    featured: true,
    pvpDanger: "Extremo (PVP Constante)",
    description:
      "A mais isolada e fortificada zona militar de Chernarus, no extremo noroeste. Complexo militar subterrâneo com bunkers, radares gigantes e helipontos com loot de mais alto calibre do mapa.",
    structures: [
      "Bunkers Subterrâneos",
      "Quartéis de Oficiais (Barracks)",
      "Torre de Radar de Longo Alcance",
      "Helipontos Militares",
      "Torres de Guarda Fortificadas",
    ],
    keyLoot: [
      "M4A1",
      "LAR (FAL)",
      "VSD (Dragunov)",
      "VSS Vintorez",
      "Miras Noturnas NVG",
      "Colete de Placa Balístico",
      "Equipamentos NBC",
      "Minas Terrestres",
    ],
    hazards:
      "Campos minados ativos nos limites florestais, zumbis militares de elite com capacete e colete, e matilhas frequentes de lobos famintos.",
    nbcRequired: false,
    heliCrashChance: "Alta",
    convoyChance: "Alta",
  },
  {
    id: "nwaf",
    name: "Zona Militar e Aérea de NWAF (Vybor Airfield)",
    shortName: "NWAF",
    x: 4500,
    z: 10200,
    radius: 1850,
    tier: "Tier 3",
    zoneType: "Aeroporto Militar",
    featured: true,
    pvpDanger: "Extremo (PVP Constante)",
    description:
      "O coração bélico de Chernarus. Um gigantesco aeródromo militar com quilômetros de pistas, terminal ATC, dezenas de hangares industriais, área de tendas do exército e quartéis centrais.",
    structures: [
      "Pista Principal e Taxiway",
      "Torre de Controle Aéreo (ATC)",
      "Hangares de Caças e Carga",
      "Complexo de Tendas Militares",
      "Quartéis Centrais do Exército",
      "Depósitos de Carregadores",
    ],
    keyLoot: [
      "KAM (AKM)",
      "M4A1",
      "DMR",
      "M16A2",
      "Colete de Placas",
      "Carregadores de 60 Rounds",
      "Mochilas de Campo Táticas",
      "Munições 5.56x45 e 7.62x39",
    ],
    hazards:
      "Ponto com maior taxa de mortes por PvP em todo o jogo. Snipers posicionados nas montanhas ao redor e vasta área aberta desprovida de abrigo.",
    nbcRequired: false,
    heliCrashChance: "Alta",
    convoyChance: "Alta",
  },
  {
    id: "pavlovo-toxic",
    name: "Zona de Contaminação Tóxica de Pavlovo (Gás NBC)",
    shortName: "Pavlovo (Gás Tóxico)",
    x: 2150,
    z: 3350,
    radius: 480,
    tier: "Zona Tóxica (Tier 4)",
    zoneType: "Zona de Contaminação Tóxica (NBC)",
    featured: true,
    pvpDanger: "Zona Tóxica Letal",
    description:
      "Complexo militar e hospital de campanha tomado por artilharia de gás químico permanente. O ar é instantaneamente letal para sobreviventes desprotegidos, mas abriga o loot militar mais raro do jogo.",
    structures: [
      "Hospital Militar de Campanha",
      "Quartéis em Quarentena",
      "Armazéns de Munição Tóxica",
      "Torres de Vigilância Contaminadas",
    ],
    keyLoot: [
      "M4A1 Exclusiva",
      "VSD",
      "Supressores Padronizados Militares",
      "Miras Táticas Raras (ATOG/NVD)",
      "Carregadores Tambor",
      "Fuzis de Alta Patente",
    ],
    hazards:
      "NUVEM TÓXICA PERMANENTE! Causa sangramento arterial incontrolável e morte em segundos sem Traje NBC completo (Capuz, Jaqueta, Calça, Luvas, Botas e Máscara com Filtro carregado).",
    nbcRequired: true,
    heliCrashChance: "Baixa",
    convoyChance: "Média",
  },
  {
    id: "rify-toxic",
    name: "Zona de Contaminação Tóxica de Rify (Navio Naufragado)",
    shortName: "Rify (Navio Gás)",
    x: 14000,
    z: 13200,
    radius: 550,
    tier: "Zona Tóxica (Tier 4)",
    zoneType: "Zona de Contaminação Tóxica (NBC)",
    featured: true,
    pvpDanger: "Zona Tóxica Letal",
    description:
      "Um enorme cargueiro que naufragou nos recifes costeiros do nordeste, permanentemente envolvido em gás tóxico. Seus contêineres e cabines de comando guardam armamento exclusivo.",
    structures: [
      "Casco do Navio Cargueiro",
      "Pátio de Contêineres Marítimos",
      "Ponte de Comando e Cabines",
      "Porão Inundado",
    ],
    keyLoot: [
      "LAR (FAL)",
      "VSS Vintorez",
      "SVAL",
      "M4A1",
      "Supressores Raros",
      "Armaduras Balísticas Avançadas",
    ],
    hazards:
      "GÁS QUÍMICO LETAL! Exige traje NBC completo. Labirinto de ferragens enferrujadas e risco de queda fatal.",
    nbcRequired: true,
    heliCrashChance: "Baixa",
    convoyChance: "Baixa",
  },
  {
    id: "kamensk",
    name: "Zona Militar de Kamensk",
    shortName: "Kamensk Militar",
    x: 7850,
    z: 14550,
    radius: 750,
    tier: "Tier 3",
    zoneType: "Complexo Militar Principal",
    featured: true,
    pvpDanger: "Alto Risco",
    description:
      "Base fortificada nas colinas densas ao norte de Kamensk. Composta por quartéis de alvenaria militar, oficinas mecânicas blindadas, posto de primeiros socorros e torres de atirador.",
    structures: [
      "Quartéis de Alvenaria",
      "Oficinas Militares",
      "Dispensário Médico",
      "Guaritas de Atirador",
    ],
    keyLoot: [
      "KA-74",
      "M16A2",
      "Uniformes Camuflados",
      "Capacetes Balísticos",
      "Kits Médicos e Soro",
      "Granadas",
    ],
    hazards: "Floresta densa que facilita emboscadas e matilhas frequentes de lobos territoriais.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Alta",
  },
  {
    id: "troitskoe",
    name: "Zona Militar de Troitskoe",
    shortName: "Troitskoe Militar",
    x: 7450,
    z: 15050,
    radius: 700,
    tier: "Tier 4",
    zoneType: "Complexo Militar Principal",
    featured: true,
    pvpDanger: "Extremo (PVP Constante)",
    description:
      "Instalação militar na extrema fronteira setentrional do mapa. Situada em alta cota topográfica em meio à taiga de coníferas, com depósitos de munição pesada e quartéis reforçados.",
    structures: [
      "Quartéis Reforçados de Fronteira",
      "Paiol de Munições",
      "Torres de Tiro Perimetrais",
    ],
    keyLoot: [
      "Fuzis de Assalto Automáticos",
      "Coletes Balísticos de Floresta",
      "Caixas de Munição Militar",
      "Equipamentos Médicos",
    ],
    hazards: "Frio intenso, isolamento absoluto e alta incidência de patrulhas armadas de clãs.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Média",
  },
  {
    id: "vmc",
    name: "Zona Militar de Veresnik (VMC)",
    shortName: "VMC (Veresnik)",
    x: 4650,
    z: 8250,
    radius: 650,
    tier: "Tier 3",
    zoneType: "Acampamento Militar de Tendas",
    featured: true,
    pvpDanger: "Extremo (PVP Constante)",
    description:
      "Zona militar no topo do monte Veresnik, rota obrigatória entre o sul e o aeroporto NWAF. Um dos pontos mais disputados para emboscadas táticas.",
    structures: [
      "Acampamento de Tendas Médicas e Militares",
      "Quartel Central de Comando",
      "Guaritas de Entrada",
    ],
    keyLoot: [
      "Fuzis de Assalto",
      "Uniformes Táticos Militares",
      "Mochilas de Combate",
      "Acessórios de Miras e Carregadores",
    ],
    hazards: "Gargalo tático com histórico constante de tiroteios entre sobreviventes.",
    nbcRequired: false,
    heliCrashChance: "Alta",
    convoyChance: "Alta",
  },
  {
    id: "myshkino",
    name: "Zona Militar de Myshkino (Acampamento)",
    shortName: "Myshkino Tendas",
    x: 1950,
    z: 7350,
    radius: 800,
    tier: "Tier 3",
    zoneType: "Acampamento Militar de Tendas",
    featured: true,
    pvpDanger: "Alto Risco",
    description:
      "Vasto complexo de tendas militares camufladas na planície oeste. Excelente ponto de transição para quem vem do litoral sudoeste rumo ao norte.",
    structures: [
      "Tendas Militares de Grande Porte",
      "Torres de Observação de Madeira",
      "Posto de Controle e Abastecimento",
    ],
    keyLoot: [
      "Tendas Militares Grandes",
      "Mochilas de Combate 63 Slots",
      "Rifles Militares e Lunetas",
      "Munições de Alto Calibre",
    ],
    hazards: "Vale aberto rodeado por colinas arborizadas perfeitas para franco-atiradores.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Média",
  },
  {
    id: "zelenogorsk-mil",
    name: "Zona Militar de Zelenogorsk (Terminal & Quartéis)",
    shortName: "Zeleno Militar",
    x: 2700,
    z: 5350,
    radius: 850,
    tier: "Tier 3",
    zoneType: "Complexo Militar Principal",
    pvpDanger: "Alto Risco",
    description:
      "Grande setor militarizado no sudoeste urbano de Zelenogorsk, integrando terminal de carga militar, oficinas ferroviárias, quartéis e pátio de blindados.",
    structures: [
      "Pátio Ferroviário de Blindados",
      "Quartéis do Setor Sul",
      "Dispensário Médico Urbano",
      "Hangares Industriais Militares",
    ],
    keyLoot: [
      "Fuzis de Assalto",
      "Coletes Balísticos",
      "Capacetes Táticos",
      "Munições Militares Variadas",
      "Medicamentos",
    ],
    hazards: "Alta densidade de infectados zumbis atraídos por disparos e proximidade residencial.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Alta",
  },
  {
    id: "neaf",
    name: "Zona Militar de NEAF (Aeroporto de Krasnostav)",
    shortName: "NEAF (Krasnostav)",
    x: 12100,
    z: 12550,
    radius: 1100,
    tier: "Tier 2",
    zoneType: "Aeroporto Militar",
    pvpDanger: "Alto Risco",
    description:
      "Aeródromo militar costeiro ao norte de Krasnostav com pista de asfalto, hangares de aeronaves, prédio médico e pequenos quartéis de guarda.",
    structures: [
      "Pista de Pouso Asfaltada",
      "Hangares de Aeronaves",
      "Posto Médico Militar",
      "Quartéis de Guarda",
    ],
    keyLoot: [
      "Pioneer",
      "SG5-K",
      "Pistolas FX-45 e Kolt 1911",
      "Uniformes da Força Aérea",
      "Rações de Sobrevivência",
    ],
    hazards:
      "Pista aberta sem proteção lateral; fácil de ser vigiado por atiradores das matas próximas.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Média",
  },
  {
    id: "balota-af",
    name: "Zona Militar de Balota (Aeroporto Litorâneo)",
    shortName: "Balota Militar",
    x: 4900,
    z: 2400,
    radius: 950,
    tier: "Tier 1",
    zoneType: "Aeroporto Militar",
    pvpDanger: "Moderado",
    description:
      "Aeródromo e base litorânea no sudoeste de Chernarus, próxima a Balota e Chernogorsk. Contém pista, hangares, acampamento de tendas e torre de rádio.",
    structures: [
      "Pista Litorânea",
      "Hangares da Aviação",
      "Tendas Militares de Campanha",
      "Torre de Rádio",
    ],
    keyLoot: [
      "Submetralhadoras",
      "Pistolas Táticas",
      "Capacetes Militares Básicos",
      "Roupas Camufladas de Entrada",
    ],
    hazards:
      "Ponto quente no litoral; jogadores recém-nascidos armados e frequentes combates iniciais.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Média",
  },
  {
    id: "staroye-tents",
    name: "Zona Militar de Staroye (Tendas da Colina)",
    shortName: "Staroye Tendas",
    x: 10150,
    z: 8400,
    radius: 500,
    tier: "Tier 2",
    zoneType: "Acampamento Militar de Tendas",
    pvpDanger: "Moderado",
    description:
      "Acampamento militar escondido entre colinas e florestas a oeste de Staroye. Composto por tendas médicas, guaritas e fogueiras táticas.",
    structures: ["Tendas de Campanha", "Posto de Primeiros Socorros", "Guaritas de Perímetro"],
    keyLoot: [
      "Fardas Militares Camufladas",
      "Kits de Primeiros Socorros",
      "Munições",
      "Rifles de Médio Porte",
    ],
    hazards:
      "Vegetação densa reduz a visibilidade; cuidado com aproximação silenciosa de outros sobreviventes.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Baixa",
  },
  {
    id: "stary-sobor-tents",
    name: "Zona Militar de Stary Sobor (Tendas Centrais)",
    shortName: "Stary Sobor Tendas",
    x: 6050,
    z: 7800,
    radius: 550,
    tier: "Tier 2",
    zoneType: "Acampamento Militar de Tendas",
    pvpDanger: "Alto Risco",
    description:
      "Local clássico e memorável de Chernarus com tendas militares do exército na orla norte de Stary Sobor.",
    structures: ["Tendas Militares do Exército", "Ponto de Reabastecimento", "Guaritas Elevadas"],
    keyLoot: [
      "Fuzis SKS",
      "Pistolas Militares",
      "Mochilas de Combate",
      "Cantis e Rações Militares",
    ],
    hazards:
      "Rodeado por morros com vista privilegiada de snipers apontados diretamente para as tendas.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Média",
  },
  {
    id: "green-mountain",
    name: "Zona Militar de Green Mountain (Torre de Transmissão)",
    shortName: "Green Mountain",
    x: 3700,
    z: 5980,
    radius: 450,
    tier: "Tier 2",
    zoneType: "Instalação Estratégica & Radar",
    pvpDanger: "Alto Risco",
    description:
      "A mais alta torre de telecomunicações de Chernarus no cume da montanha Zelena Hora. Possui muralhas fortificadas, portão único e quartel militar anexo.",
    structures: [
      "Torre Gigante de Rádio",
      "Muralhas Fortificadas com Arame",
      "Quartel Anexo",
      "Guarita do Portão Principal",
    ],
    keyLoot: [
      "Equipamento de Radiocomunicação",
      "Walkie-talkies e Baterias 9V",
      "Uniformes Táticos",
      "Munições",
    ],
    hazards:
      "Gargalo único de entrada no portão frontal; ponto comum de traders ou bases fortificadas.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Baixa",
  },
  {
    id: "prison-island",
    name: "Zona Militar da Ilha da Prisão (Prison Island)",
    shortName: "Prison Island",
    x: 2750,
    z: 1300,
    radius: 600,
    tier: "Tier 2",
    zoneType: "Instalação Estratégica & Radar",
    pvpDanger: "Alto Risco",
    description:
      "Complexo penitenciário insular de segurança máxima ao sul da costa. Blocos de celas de concreto, salas de controle, arsenal e torres de metralhadora.",
    structures: [
      "Pavilhões Prisionais de Concreto",
      "Arsenal Central",
      "Torres de Vigilância Costeira",
      "Cais Militar de Desembarque",
    ],
    keyLoot: [
      "Coletes Balísticos Antimotim",
      "Escopetas Vaiga e BK-133",
      "Granadas de Fumaça e Efeito Moral",
      "Pistolas",
    ],
    hazards:
      "Acesso marítimo por natação (risco de hipotermia se não estiver aquecido) e corredores escuros.",
    nbcRequired: false,
    heliCrashChance: "Nenhuma",
    convoyChance: "Nenhuma",
  },
  {
    id: "altar-radar",
    name: "Zona de Radar e Comunicações de Altar",
    shortName: "Altar Radar",
    x: 8100,
    z: 9050,
    radius: 500,
    tier: "Tier 2",
    zoneType: "Instalação Estratégica & Radar",
    pvpDanger: "Moderado",
    description:
      "Instalação técnica governamental no coração geográfico de Chernarus. Antenas de grande porte, galpões e presença de segurança armada.",
    structures: [
      "Antenas Parabólicas de Radar",
      "Galpão Técnico Militar",
      "Posto de Guarda Central",
    ],
    keyLoot: [
      "Rádios de Longo Alcance",
      "Baterias",
      "Equipamentos Eletrônicos",
      "Munições Militares",
    ],
    hazards: "Silhueta visível de muitos pontos do mapa central.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Média",
  },
  {
    id: "severograd-mil",
    name: "Zona Militar de Severograd (Terminal Oeste)",
    shortName: "Severograd Militar",
    x: 7800,
    z: 12700,
    radius: 600,
    tier: "Tier 3",
    zoneType: "Complexo Militar Principal",
    pvpDanger: "Alto Risco",
    description:
      "Posto militar com quartéis e postos de controle na borda oeste da cidade industrial de Severograd.",
    structures: ["Quartéis de Alvenaria", "Guaritas Ferroviárias", "Depósito de Equipamento"],
    keyLoot: ["Capacetes Balísticos", "Uniformes TTsKO", "Fuzis de Assalto", "Munições Militares"],
    hazards: "Proximidade com a ferrovia e grande tráfego urbano de infectados.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Alta",
  },
  {
    id: "kabanino-cp",
    name: "Zona Militar de Kabanino (Posto da Rodovia)",
    shortName: "Kabanino Checkpoint",
    x: 5300,
    z: 8600,
    radius: 350,
    tier: "Tier 2",
    zoneType: "Posto Avançado de Bloqueio",
    pvpDanger: "Alto Risco",
    description:
      "Barreira militar de controle na rodovia entre Stary Sobor e NWAF com sacos de areia, veículos blindados e guarita.",
    structures: ["Barricadas de Concreto e Arame", "Guarita Reforçada", "Blindado Destruído"],
    keyLoot: ["Pistolas Militares", "Suprimentos Médicos", "Munições", "Rações"],
    hazards: "Trecho reto de alta velocidade frequentemente vigiado por sobreviventes armados.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Alta",
  },
  {
    id: "sosnovka-cp",
    name: "Zona Militar de Sosnovka (Desfiladeiro)",
    shortName: "Sosnovka Checkpoint",
    x: 2500,
    z: 6400,
    radius: 350,
    tier: "Tier 2",
    zoneType: "Posto Avançado de Bloqueio",
    pvpDanger: "Moderado",
    description:
      "Posto militar no desfiladeiro ocidental que conecta Zelenogorsk a Myshkino com barricadas e tendas.",
    structures: ["Barricadas Táticas", "Tenda de Guarda", "Guarita Rodoviária"],
    keyLoot: ["Coletes Táticos Leves", "Capacetes Militares", "Munições"],
    hazards: "Ponto de passagem estreito com vantagem para quem vigia do alto das rochas.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Média",
  },
  {
    id: "gorka-outpost",
    name: "Zona Militar de Gorka (Posto Avançado)",
    shortName: "Gorka Outpost",
    x: 9500,
    z: 8900,
    radius: 400,
    tier: "Tier 2",
    zoneType: "Posto Avançado de Bloqueio",
    pvpDanger: "Moderado",
    description:
      "Guaritas e tendas médicas militares no trevo norte de Gorka rumo a Altar e Krasnostav.",
    structures: ["Guaritas de Esquina", "Tenda Médica Militar", "Trincheiras de Sacos de Areia"],
    keyLoot: ["Fardas Camufladas Gorka", "Carregadores", "Kits de Costura Militar"],
    hazards: "Visão desprotegida a partir das encostas que cercam a cidade.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Média",
  },
  {
    id: "cherno-tents",
    name: "Zona Militar de Chernogorsk (Quarentena Portuária)",
    shortName: "Cherno Militar",
    x: 6500,
    z: 2400,
    radius: 650,
    tier: "Tier 1",
    zoneType: "Posto Avançado de Bloqueio",
    pvpDanger: "Alto Risco",
    description:
      "Tendas médicas militares e bloqueios da quarentena na entrada leste e área portuária de Chernogorsk.",
    structures: ["Tendas de Triagem Médica", "Barreiras Portuárias", "Guaritas de Quarentena"],
    keyLoot: ["Capacetes Básicos", "Pistolas", "Bandagens Médicas Militares", "Comida Enlatada"],
    hazards: "Maior cidade do jogo; combate intenso entre jogadores armados na costa.",
    nbcRequired: false,
    heliCrashChance: "Nenhuma",
    convoyChance: "Baixa",
  },
  {
    id: "elektro-outpost",
    name: "Zona Militar de Elektrozavodsk (Triagem)",
    shortName: "Elektro Militar",
    x: 10500,
    z: 2350,
    radius: 600,
    tier: "Tier 1",
    zoneType: "Posto Avançado de Bloqueio",
    pvpDanger: "Alto Risco",
    description:
      "Barreira militar e posto de triagem na zona portuária e ferroviária de Elektrozavodsk.",
    structures: ["Barreiras de Quarentena", "Guarita Ferroviária", "Tenda de Primeiros Socorros"],
    keyLoot: ["Equipamentos Iniciais de Proteção", "Cantil", "Munições 9mm e .380"],
    hazards: "Ponto de encontro caótico de recém-nascidos e snipers na colina dos bombeiros.",
    nbcRequired: false,
    heliCrashChance: "Nenhuma",
    convoyChance: "Baixa",
  },
  {
    id: "berezino-quarantine",
    name: "Zona Militar de Berezino (Quarentena Litorânea)",
    shortName: "Berezino Militar",
    x: 12050,
    z: 9100,
    radius: 650,
    tier: "Tier 1",
    zoneType: "Posto Avançado de Bloqueio",
    pvpDanger: "Alto Risco",
    description:
      "Pátio de quarentena militar com tendas e bloqueios rodoviários ao norte dos galpões industriais de Berezino.",
    structures: [
      "Tendas Hospitalares de Quarentena",
      "Postos de Controle Costeiros",
      "Torres de Guarda",
    ],
    keyLoot: [
      "Pistolas e Carregadores",
      "Kits de Sangue e Soro",
      "Coletes Leves",
      "Fardas de Entrada",
    ],
    hazards: "Área de combate entre sobreviventes armados da costa leste.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Baixa",
  },
  {
    id: "sinystok-depot",
    name: "Zona Militar de Sinystok (Depósito Avançado)",
    shortName: "Sinystok Militar",
    x: 1350,
    z: 12150,
    radius: 500,
    tier: "Tier 4",
    zoneType: "Complexo Militar Principal",
    pvpDanger: "Extremo (PVP Constante)",
    description:
      "Depósito avançado de munições e suprimentos táticos escondido a oeste de Sinystok, nas matas de fronteira com Tisy.",
    structures: ["Paióis de Munição Camuflados", "Guarita de Tiro Periférica", "Quartel de Guarda"],
    keyLoot: ["Munições 5.56 e 7.62", "Fuzis de Assalto", "Acessórios Táticos", "Uniformes T4"],
    hazards: "Área de fronteira ermitã habitada por lobos e patrulhas pesadas de sobreviventes.",
    nbcRequired: false,
    heliCrashChance: "Média",
    convoyChance: "Baixa",
  },
  {
    id: "pavlovo-radar",
    name: "Zona Militar de Pavlovo Sul (Posto de Radar)",
    shortName: "Pavlovo Radar Sul",
    x: 1700,
    z: 3850,
    radius: 400,
    tier: "Tier 3",
    zoneType: "Instalação Estratégica & Radar",
    pvpDanger: "Alto Risco",
    description:
      "Posto de radar e escuta perimétrica a oeste da zona de gás de Pavlovo, fora da área contaminada.",
    structures: ["Domo de Radar Militar", "Quartel Pequeno de Observação", "Cercado de Segurança"],
    keyLoot: ["Rifles de Precisão", "Capacetes Militares", "Equipamento NBC Solto", "Rádios"],
    hazards: "Proximidade imediata com a nuvem de gás tóxico ao sul.",
    nbcRequired: false,
    heliCrashChance: "Baixa",
    convoyChance: "Média",
  },
];

type Kind = "Base" | "Trader" | "Zona PvP" | "Zona segura" | "Loot" | "Ponto de interesse";
const KINDS: Kind[] = ["Base", "Trader", "Zona PvP", "Zona segura", "Loot", "Ponto de interesse"];
const COLORS: Record<Kind, string> = {
  Base: "var(--primary)",
  Trader: "var(--chart-2)",
  "Zona PvP": "var(--destructive)",
  "Zona segura": "var(--chart-3)",
  Loot: "var(--chart-4)",
  "Ponto de interesse": "var(--chart-5)",
};

type Marker = {
  id: string;
  name: string;
  kind: Kind;
  x: number;
  z: number;
  owner: string;
  members: string;
  notes: string;
  created: string;
};

const SIZE = 15360; // Chernarus world size in meters
const KEY = "dayz-map-markers";
const DEFAULT_MILITARY_ZONES_STORAGE_KEY = "dayz-military-zones-v2";

function loadInitialMilitaryZones(): MilitaryZone[] {
  try {
    const raw = localStorage.getItem(DEFAULT_MILITARY_ZONES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  try {
    const savedRadii = localStorage.getItem(DEFAULT_ZONE_RADIUS_STORAGE_KEY);
    if (savedRadii) {
      const overrides = JSON.parse(savedRadii);
      return MILITARY_ZONES.map((z) => ({
        ...z,
        radius: overrides[z.id] !== undefined ? overrides[z.id] : z.radius,
      }));
    }
  } catch {
    /* ignore */
  }
  return MILITARY_ZONES;
}


// Cidades civis de Chernarus (coordenadas aproximadas)
const CITIES: [name: string, x: number, z: number][] = [
  ["Chernogorsk", 6500, 2400],
  ["Elektrozavodsk", 10500, 2300],
  ["Berezino", 12000, 9100],
  ["Solnichniy", 13400, 6200],
  ["Kamyshovo", 12100, 3500],
  ["Krasnostav", 11200, 12200],
  ["Svetloyarsk", 13900, 13200],
  ["Severograd", 7800, 12700],
  ["Novodmitrovsk", 11400, 14400],
  ["Zelenogorsk", 2700, 5300],
  ["Vybor", 3800, 8900],
  ["Stary Sobor", 6000, 7700],
  ["Novy Sobor", 7100, 7700],
  ["Gorka", 9500, 8800],
  ["Staroye", 10100, 5500],
  ["Msta", 11300, 5400],
  ["Polana", 10700, 8100],
  ["Dolina", 11200, 6600],
  ["Shakhovka", 9600, 6600],
  ["Kabanino", 5300, 8600],
  ["Grishino", 5900, 10300],
  ["Gvozdno", 8600, 11900],
  ["Dubrovka", 10400, 9800],
  ["Rogovo", 4800, 6800],
  ["Pogorevka", 4400, 6400],
  ["Pustoshka", 3000, 7800],
  ["Myshkino", 2000, 7300],
  ["Lopatino", 2800, 10000],
  ["Novaya Petrovka", 3400, 13000],
  ["Sinystok", 1500, 12000],
  ["Topolniki", 2800, 11300],
  ["Tisy", 1700, 13900],
  ["Kamensk", 7600, 14400],
  ["Sosnovka", 2500, 6400],
  ["Vavilovo", 2200, 11000],
  ["Ratnoe", 6200, 12700],
];

export function MapPanel() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [selectedMilitaryZone, setSelectedMilitaryZone] = useState<MilitaryZone | null>(null);
  const [activeTab, setActiveTab] = useState<"military" | "pvp" | "custom">("military");
  const [filter, setFilter] = useState<Set<Kind>>(new Set(KINDS));
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<Kind | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [showMilitaryZones, setShowMilitaryZones] = useState(true);
  const [showZoneRadii, setShowZoneRadii] = useState(true);
  const [showPvpZones, setShowPvpZones] = useState(true);
  const [militaryTierFilter, setMilitaryTierFilter] = useState<string>("ALL");
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<"topographic" | "satellite">("topographic");
  const [ultraHd, setUltraHd] = useState<boolean>(true);

  // Zonas Militares Dinâmicas (Permite Mover, Alterar Raio, Excluir e Adicionar Novas)
  const [militaryZones, setMilitaryZones] = useState<MilitaryZone[]>(() =>
    loadInitialMilitaryZones(),
  );
  const [repositioningZone, setRepositioningZone] = useState<{
    type: "pvp" | "military";
    id: string;
  } | null>(null);
  const [addingMilitaryZone, setAddingMilitaryZone] = useState<boolean>(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState<"military" | "pvp" | null>(null);
  const [newZoneForm, setNewZoneForm] = useState({
    name: "",
    shortName: "",
    x: 7500,
    z: 7500,
    radius: 500,
    tier: "Tier 3" as MilitaryTier,
    zoneType: "Complexo Militar Principal" as MilitaryZoneType,
    pvpType: "pvp_allowed" as "pvp_allowed" | "safezone",
    description: "",
  });

  // Estados do Sistema de Zonas de PvP e PvE Protegido
  const [pvpZones, setPvpZones] = useState<PvpZone[]>(() => loadPvpZones());
  const [selectedPvpZoneId, setSelectedPvpZoneId] = useState<string | null>(null);
  const [addingPvpZone, setAddingPvpZone] = useState<boolean>(false);
  const [pvpRestrictedMode, setPvpRestrictedMode] = useState<boolean>(() =>
    loadPvpRestrictedMode(),
  );
  const [showInitScriptModal, setShowInitScriptModal] = useState<boolean>(false);
  const [raidConfig, setRaidConfig] = useState<BaseRaidConfig>(() => loadBaseRaidConfig());

  // Armazena itens e % de chance de spawn customizados por zona militar
  const [zoneLootOverrides, setZoneLootOverrides] = useState<Record<string, ZoneLootItem[]>>({});
  // Armazena raios e áreas customizadas por zona militar (permite diminuir ou aumentar qualquer zona)
  const [zoneRadiusOverrides, setZoneRadiusOverrides] = useState<Record<string, number>>({});
  const [newItemName, setNewItemName] = useState("");
  const [newItemChance, setNewItemChance] = useState<number>(25);
  const [showDropChanceModal, setShowDropChanceModal] = useState<boolean>(false);
  const [modalSelectedZoneId, setModalSelectedZoneId] = useState<string>("tisy");

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 680,
  });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    hasMoved: false,
  });

  // Tamanho base ajustado para cobrir o viewport por completo e nunca deixar bordas pretas
  const baseSize = Math.max(viewportSize.width, viewportSize.height) || 800;
  const currentSize = Math.round(baseSize * zoom);

  const clampPan = (
    px: number,
    py: number,
    targetZoom = zoom,
    w = viewportSize.width,
    h = viewportSize.height,
  ) => {
    const bSize = Math.max(w, h) || 800;
    const cSize = bSize * targetZoom;
    const minX = w - cSize;
    const minY = h - cSize;
    return {
      x: Math.min(0, Math.max(minX, px)),
      y: Math.min(0, Math.max(minY, py)),
    };
  };

  useEffect(() => {
    try {
      setMarkers(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      /* ignore */
    }
    try {
      const savedLoot = localStorage.getItem(DEFAULT_ZONE_LOOT_STORAGE_KEY);
      if (savedLoot) {
        setZoneLootOverrides(JSON.parse(savedLoot));
      }
    } catch {
      /* ignore */
    }
    try {
      const savedRadii = localStorage.getItem(DEFAULT_ZONE_RADIUS_STORAGE_KEY);
      if (savedRadii) {
        setZoneRadiusOverrides(JSON.parse(savedRadii));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRepositioningZone(null);
        setAddingMilitaryZone(false);
        setAddingPvpZone(false);
        setShowAddZoneModal(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const saveMilitaryZones = (zones: MilitaryZone[]) => {
    setMilitaryZones(zones);
    try {
      localStorage.setItem(DEFAULT_MILITARY_ZONES_STORAGE_KEY, JSON.stringify(zones));
    } catch {
      /* ignore */
    }
  };

  // Lista com as zonas militares aplicando as modificações dinâmicas
  const effectiveMilitaryZones = militaryZones;

  // Zona selecionada atualizada em tempo real com as alterações de posição e raio
  const currentSelectedZone = useMemo(() => {
    if (!selectedMilitaryZone) return null;
    return (
      militaryZones.find((z) => z.id === selectedMilitaryZone.id) ?? selectedMilitaryZone
    );
  }, [selectedMilitaryZone, militaryZones]);

  const currentSelectedPvpZone = useMemo(() => {
    return pvpZones.find((z) => z.id === selectedPvpZoneId) ?? null;
  }, [pvpZones, selectedPvpZoneId]);

  const handleUpdateMilitaryZoneCoords = (zoneId: string, x: number, z: number) => {
    const clampedX = Math.max(0, Math.min(SIZE, Math.round(x)));
    const clampedZ = Math.max(0, Math.min(SIZE, Math.round(z)));
    const updated = militaryZones.map((zone) =>
      zone.id === zoneId ? { ...zone, x: clampedX, z: clampedZ } : zone,
    );
    saveMilitaryZones(updated);
    toast.success(`Posição da zona militar atualizada: X: ${clampedX} · Z: ${clampedZ}!`, {
      id: `coords-${zoneId}`,
    });
  };

  const handleResetMilitaryZoneCoords = (zoneId: string) => {
    const defaultZone = MILITARY_ZONES.find((z) => z.id === zoneId);
    if (!defaultZone) return;
    const updated = militaryZones.map((zone) =>
      zone.id === zoneId ? { ...zone, x: defaultZone.x, z: defaultZone.z } : zone,
    );
    saveMilitaryZones(updated);
    toast.success(`Posição original restaurada: X: ${defaultZone.x} · Z: ${defaultZone.z}!`);
  };

  const handleDeleteMilitaryZone = (zoneId: string) => {
    const zoneToDelete = militaryZones.find((z) => z.id === zoneId);
    const updated = militaryZones.filter((z) => z.id !== zoneId);
    saveMilitaryZones(updated);
    if (selectedMilitaryZone?.id === zoneId) {
      setSelectedMilitaryZone(null);
    }
    toast.info(`Zona Militar "${zoneToDelete?.name ?? zoneId}" removida do mapa.`);
  };

  const handleResetAllMilitaryZones = () => {
    saveMilitaryZones(MILITARY_ZONES);
    setSelectedMilitaryZone(null);
    toast.success(
      "Todas as 25 zonas militares originais de Chernarus foram restauradas para as posições padrão!",
    );
  };

  const handleAddMilitaryZone = (newZone: MilitaryZone) => {
    const updated = [...militaryZones, newZone];
    saveMilitaryZones(updated);
    setSelectedMilitaryZone(newZone);
    setActiveTab("military");
    focusOnLocation(newZone.x, newZone.z, 2.5);
    toast.success(`Nova zona militar "${newZone.name}" adicionada ao mapa!`);
  };

  const handleUpdatePvpZoneCoords = (id: string, x: number, z: number) => {
    const clampedX = Math.max(0, Math.min(SIZE, Math.round(x)));
    const clampedZ = Math.max(0, Math.min(SIZE, Math.round(z)));
    const updated = pvpZones.map((z) =>
      z.id === id ? { ...z, x: clampedX, z: clampedZ } : z,
    );
    setPvpZones(updated);
    savePvpZones(updated);
    toast.success(`Posição da Zona de PvP atualizada: X: ${clampedX} · Z: ${clampedZ}!`, {
      id: `pvp-coords-${id}`,
    });
  };

  const handleUpdatePvpZoneField = (id: string, patch: Partial<PvpZone>) => {
    const updated = pvpZones.map((z) => (z.id === id ? { ...z, ...patch } : z));
    setPvpZones(updated);
    savePvpZones(updated);
  };

  // Dynamic Slippy Tile calculations for Ultra-HD Crispness at high zoom
  const visibleTiles = useMemo(() => {
    if (!ultraHd || zoom < 1.35) return [];

    const tileZ = zoom >= 3.6 ? 6 : 5;
    const numTiles = 1 << tileZ;

    const w = viewportSize.width || 800;
    const h = viewportSize.height || 680;

    const minVisX = -pan.x;
    const maxVisX = -pan.x + w;
    const minVisY = -pan.y;
    const maxVisY = -pan.y + h;

    const normMinX = Math.max(0, minVisX / currentSize);
    const normMaxX = Math.min(1, maxVisX / currentSize);
    const normMinY = Math.max(0, minVisY / currentSize);
    const normMaxY = Math.min(1, maxVisY / currentSize);

    const tileMinX = Math.max(0, Math.floor(normMinX * numTiles) - 1);
    const tileMaxX = Math.min(numTiles - 1, Math.floor(normMaxX * numTiles) + 1);
    const tileMinY = Math.max(0, Math.floor(normMinY * numTiles) - 1);
    const tileMaxY = Math.min(numTiles - 1, Math.floor(normMaxY * numTiles) + 1);

    const tiles: { z: number; x: number; y: number; key: string }[] = [];
    for (let ty = tileMinY; ty <= tileMaxY; ty++) {
      for (let tx = tileMinX; tx <= tileMaxX; tx++) {
        tiles.push({
          z: tileZ,
          x: tx,
          y: ty,
          key: `${tileZ}-${tx}-${ty}-${mapStyle}`,
        });
      }
    }
    return tiles;
  }, [ultraHd, zoom, pan, currentSize, viewportSize, mapStyle]);

  const handleUpdatePvpZoneRadius = (id: string, radius: number) => {
    const clamped = Math.max(50, Math.min(5000, Math.round(radius)));
    const updated = pvpZones.map((z) => (z.id === id ? { ...z, radius: clamped } : z));
    setPvpZones(updated);
    savePvpZones(updated);
  };

  const handleTogglePvpZone = (id: string) => {
    const updated = pvpZones.map((z) => (z.id === id ? { ...z, enabled: !z.enabled } : z));
    setPvpZones(updated);
    savePvpZones(updated);
    toast.success("Status da zona de PvP atualizado!");
  };

  const handleDeletePvpZone = (id: string) => {
    const updated = pvpZones.filter((z) => z.id !== id);
    setPvpZones(updated);
    savePvpZones(updated);
    if (selectedPvpZoneId === id) setSelectedPvpZoneId(null);
    toast.info("Zona de PvP removida com sucesso!");
  };

  const handleToggleRestrictedPvp = (active: boolean) => {
    setPvpRestrictedMode(active);
    savePvpRestrictedMode(active);
    if (active) {
      toast.success(
        "🛡️ Modo PvP Restrito ATIVADO: Fora das zonas marcadas, tiro em jogadores está BLOQUEADO!",
      );
    } else {
      toast.info(
        "⚔️ Modo PvP Livre (Vanilla): Tiro em jogadores permitido em qualquer lugar do mapa.",
      );
    }
  };

  const handleToggleRaidQuick = (active: boolean) => {
    const next = { ...raidConfig, raidEnabled: active };
    setRaidConfig(next);
    saveBaseRaidConfig(next);
    if (active) {
      toast.success("💥 Raid de Bases ATIVADO: Danos em portões e paredes liberados!");
    } else {
      toast.info("🛡️ Raid de Bases DESATIVADO: Bases 100% protegidas contra danos!");
    }
  };

  const handleAddPresetPvpZone = (preset: (typeof DEFAULT_PVP_ZONES)[0]) => {
    if (pvpZones.some((z) => z.shortName === preset.shortName)) {
      toast.info(`A zona ${preset.shortName} já está cadastrada!`);
      focusOnLocation(preset.x, preset.z, 2.5);
      setSelectedPvpZoneId(preset.id);
      return;
    }
    const newZone: PvpZone = { ...preset, id: `pvp-${Date.now()}` };
    const updated = [...pvpZones, newZone];
    setPvpZones(updated);
    savePvpZones(updated);
    setSelectedPvpZoneId(newZone.id);
    setActiveTab("pvp");
    focusOnLocation(newZone.x, newZone.z, 2.5);
    toast.success(`Zona de PvP "${newZone.name}" adicionada ao mapa!`);
  };

  // Altera o raio (área) de uma zona militar (mínimo 50m, máximo 10.000m)
  const handleUpdateZoneRadius = (zoneId: string, newRadius: number) => {
    const clamped = Math.max(50, Math.min(10000, Math.round(newRadius)));
    const updated = militaryZones.map((z) => (z.id === zoneId ? { ...z, radius: clamped } : z));
    saveMilitaryZones(updated);
    toast.success(`Área da zona militar ajustada: raio de ${clamped}m!`, {
      id: `radius-${zoneId}`,
    });
  };

  // Restaura o raio original da zona militar
  const handleResetZoneRadius = (zoneId: string) => {
    const defaultZone = MILITARY_ZONES.find((z) => z.id === zoneId);
    if (!defaultZone) return;
    const updated = militaryZones.map((z) =>
      z.id === zoneId ? { ...z, radius: defaultZone.radius } : z,
    );
    saveMilitaryZones(updated);
    toast.success(`Raio da zona restaurado para o padrão original (${defaultZone.radius}m)!`);
  };

  const saveZoneLoot = (zoneId: string, items: ZoneLootItem[]) => {
    setZoneLootOverrides((prev) => {
      const updated = { ...prev, [zoneId]: items };
      try {
        localStorage.setItem(DEFAULT_ZONE_LOOT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const getZoneItems = (zone: MilitaryZone): ZoneLootItem[] => {
    return zoneLootOverrides[zone.id] || getDefaultZoneLoot(zone);
  };

  const handleUpdateItemChance = (zoneId: string, itemId: string, newChance: number) => {
    const zone = MILITARY_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    const currentItems = getZoneItems(zone);
    const clamped = Math.max(1, Math.min(100, Math.round(newChance)));
    const updated = currentItems.map((item) =>
      item.id === itemId ? { ...item, chance: clamped } : item,
    );
    saveZoneLoot(zoneId, updated);
  };

  const handleAddItemToZone = (zoneId: string, customName?: string, customChance?: number) => {
    const targetName = (customName ?? newItemName).trim();
    if (!targetName) {
      toast.error("Digite o nome ou classname do item");
      return;
    }
    const zone = MILITARY_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    const currentItems = getZoneItems(zone);
    const chance = Math.max(
      1,
      Math.min(100, Math.round(customChance !== undefined ? customChance : newItemChance)),
    );
    const newItem: ZoneLootItem = {
      id: crypto.randomUUID(),
      name: targetName,
      chance,
    };
    const updated = [...currentItems, newItem];
    saveZoneLoot(zoneId, updated);
    if (!customName) {
      setNewItemName("");
      setNewItemChance(25);
    }
    toast.success(`Item "${newItem.name}" adicionado com ${newItem.chance}% de chance!`);
  };

  const handleRemoveItemFromZone = (zoneId: string, itemId: string) => {
    const zone = MILITARY_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    const currentItems = getZoneItems(zone);
    const updated = currentItems.filter((i) => i.id !== itemId);
    saveZoneLoot(zoneId, updated);
    toast.info("Item removido da tabela de loot da zona");
  };

  const handleResetZoneLoot = (zone: MilitaryZone) => {
    const defaults = getDefaultZoneLoot(zone);
    saveZoneLoot(zone.id, defaults);
    toast.success("Chances de loot restauradas para o padrão oficial!");
  };

  const copyZoneLootXml = (zone: MilitaryZone) => {
    const items = getZoneItems(zone);
    const xmlLines = [
      `<!-- Tabela de Spawns com % de Chance na Zona: ${zone.name} [Raio: ${zone.radius}m] -->`,
      `<type name="ZoneLoot_${zone.id}">`,
      ...items.map(
        (i) =>
          `    <item name="${i.name}" chance="${(i.chance / 100).toFixed(2)}" /> <!-- ${i.chance}% de probabilidade de spawn -->`,
      ),
      `</type>`,
    ];
    const xml = xmlLines.join("\n");
    navigator.clipboard.writeText(xml);
    toast.success(`XML com % de chance copiado para cfgspawnabletypes.xml!`);
  };

  const copyZoneLootJson = (zone: MilitaryZone) => {
    const items = getZoneItems(zone);
    const json = JSON.stringify(
      {
        zoneId: zone.id,
        zoneName: zone.name,
        tier: zone.tier,
        radiusMeters: zone.radius,
        coordinates: { x: zone.x, y: 0, z: zone.z },
        lootTable: items.map((i) => ({
          item: i.name,
          chancePercent: i.chance,
          probabilityDecimal: +(i.chance / 100).toFixed(2),
        })),
      },
      null,
      2,
    );
    navigator.clipboard.writeText(json);
    toast.success(`JSON com % de chance de cada item copiado!`);
  };

  const getChanceBadge = (chance: number) => {
    if (chance <= 15) {
      return {
        label: "Muito Raro",
        badge: "bg-red-950/80 text-red-300 border-red-800",
        bar: "bg-red-500",
      };
    }
    if (chance <= 35) {
      return {
        label: "Raro",
        badge: "bg-amber-950/80 text-amber-300 border-amber-800",
        bar: "bg-amber-500",
      };
    }
    if (chance <= 65) {
      return {
        label: "Equilibrado",
        badge: "bg-lime-950/80 text-lime-300 border-lime-800",
        bar: "bg-lime-500",
      };
    }
    return {
      label: "Comum",
      badge: "bg-sky-950/80 text-sky-300 border-sky-800",
      bar: "bg-sky-500",
    };
  };

  const handleBatchAdjustChances = (
    zoneId: string,
    action: "add10" | "sub10" | "double" | "set50" | "set100",
  ) => {
    const zone = MILITARY_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    const currentItems = getZoneItems(zone);
    const updated = currentItems.map((item) => {
      let nextChance = item.chance;
      if (action === "add10") nextChance = Math.min(100, item.chance + 10);
      else if (action === "sub10") nextChance = Math.max(1, item.chance - 10);
      else if (action === "double") nextChance = Math.min(100, item.chance * 2);
      else if (action === "set50") nextChance = 50;
      else if (action === "set100") nextChance = 100;
      return { ...item, chance: nextChance };
    });
    saveZoneLoot(zoneId, updated);
    toast.success("Chances de drop da zona atualizadas!");
  };

  // Monitora o redimensionamento do contêiner e garante preenchimento sem bordas pretas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setViewportSize({ width: w, height: h });
        setPan((prevPan) => {
          const bSize = Math.max(w, h);
          const cSize = bSize * zoom;
          const minX = w - cSize;
          const minY = h - cSize;

          if (prevPan.x === 0 && prevPan.y === 0 && zoom === 1) {
            return {
              x: Math.round((w - cSize) / 2),
              y: Math.round((h - cSize) / 2),
            };
          }

          return {
            x: Math.min(0, Math.max(minX, prevPan.x)),
            y: Math.min(0, Math.max(minY, prevPan.y)),
          };
        });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoom]);

  // Zoom suave com a roda do mouse (wheel) sem rolar a página
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;

      setZoom((currZoom) => {
        const nextZoom = Math.min(8, Math.max(1, +(currZoom + delta).toFixed(2)));
        if (nextZoom === currZoom) return currZoom;

        const w = el.clientWidth || 800;
        const h = el.clientHeight || 680;
        const bSize = Math.max(w, h);
        const prevSize = bSize * currZoom;
        const nextSize = bSize * nextZoom;

        const rect = el.getBoundingClientRect();
        const pivotX = e.clientX - rect.left;
        const pivotY = e.clientY - rect.top;

        setPan((prevPan) => {
          const ratio = nextSize / prevSize;
          const newX = pivotX - (pivotX - prevPan.x) * ratio;
          const newY = pivotY - (pivotY - prevPan.y) * ratio;
          const minX = w - nextSize;
          const minY = h - nextSize;
          return {
            x: Math.min(0, Math.max(minX, newX)),
            y: Math.min(0, Math.max(minY, newY)),
          };
        });

        return nextZoom;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [viewportSize]);

  const save = (m: Marker[]) => {
    setMarkers(m);
    localStorage.setItem(KEY, JSON.stringify(m));
  };

  const toWorld = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, z: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const mapX = (mx - pan.x) / currentSize;
    const mapY = (my - pan.y) / currentSize;

    const clampedX = Math.max(0, Math.min(1, mapX));
    const clampedY = Math.max(0, Math.min(1, mapY));

    return {
      x: Math.round(clampedX * SIZE),
      z: Math.round((1 - clampedY) * SIZE),
    };
  };

  const handleZoomChange = (targetZoom: number) => {
    setZoom((currZoom) => {
      const nextZoom = Math.min(8, Math.max(1, +targetZoom.toFixed(2)));
      if (nextZoom === currZoom) return currZoom;

      const w = viewportSize.width || 800;
      const h = viewportSize.height || 680;
      const bSize = Math.max(w, h);
      const prevSize = bSize * currZoom;
      const nextSize = bSize * nextZoom;

      const pivotX = w / 2;
      const pivotY = h / 2;

      setPan((prevPan) => {
        const ratio = nextSize / prevSize;
        const newX = pivotX - (pivotX - prevPan.x) * ratio;
        const newY = pivotY - (pivotY - prevPan.y) * ratio;
        const minX = w - nextSize;
        const minY = h - nextSize;
        return {
          x: Math.min(0, Math.max(minX, newX)),
          y: Math.min(0, Math.max(minY, newY)),
        };
      });

      return nextZoom;
    });
  };

  const focusOnLocation = (worldX: number, worldZ: number, targetZoom = 2.5) => {
    const w = viewportSize.width || 800;
    const h = viewportSize.height || 680;
    const bSize = Math.max(w, h);
    const newZoom = Math.min(8, Math.max(zoom, targetZoom));
    const newSize = bSize * newZoom;

    const normX = worldX / SIZE;
    const normY = 1 - worldZ / SIZE;

    const targetPanX = w / 2 - normX * newSize;
    const targetPanY = h / 2 - normY * newSize;

    const minX = w - newSize;
    const minY = h - newSize;

    setZoom(newZoom);
    setPan({
      x: Math.min(0, Math.max(minX, targetPanX)),
      y: Math.min(0, Math.max(minY, targetPanY)),
    });
  };

  const resetView = () => {
    const w = viewportSize.width || 800;
    const h = viewportSize.height || 680;
    const bSize = Math.max(w, h);
    setZoom(1);
    setPan({
      x: Math.round((w - bSize) / 2),
      y: Math.round((h - bSize) / 2),
    });
    toast.info("Visualização centralizada e sem bordas");
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      hasMoved: false,
    };
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toWorld(e.clientX, e.clientY);
    setHover(p);

    if (!isDragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.hypot(dx, dy) > 4) {
      dragRef.current.hasMoved = true;
    }

    setPan(() =>
      clampPan(
        dragRef.current.startPanX + dx,
        dragRef.current.startPanY + dy,
        zoom,
        viewportSize.width,
        viewportSize.height,
      ),
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    if (!dragRef.current.hasMoved && repositioningZone) {
      const p = toWorld(e.clientX, e.clientY);
      if (repositioningZone.type === "military") {
        handleUpdateMilitaryZoneCoords(repositioningZone.id, p.x, p.z);
        const zTarget = militaryZones.find((z) => z.id === repositioningZone.id);
        toast.success(
          `📍 Zona Militar "${zTarget?.shortName ?? zTarget?.name ?? "Militar"}" movida para X:${p.x} Z:${p.z}!`,
        );
        focusOnLocation(p.x, p.z, Math.max(zoom, 2.5));
      } else {
        handleUpdatePvpZoneCoords(repositioningZone.id, p.x, p.z);
        const zTarget = pvpZones.find((z) => z.id === repositioningZone.id);
        toast.success(
          `📍 Zona de PvP "${zTarget?.shortName ?? zTarget?.name ?? "PvP"}" movida para X:${p.x} Z:${p.z}!`,
        );
        focusOnLocation(p.x, p.z, Math.max(zoom, 2.5));
      }
      setRepositioningZone(null);
      return;
    }

    if (!dragRef.current.hasMoved && addingMilitaryZone) {
      const p = toWorld(e.clientX, e.clientY);
      const newZone: MilitaryZone = {
        id: `custom-mil-${Date.now()}`,
        name: `Zona Militar Nova ${militaryZones.length + 1}`,
        shortName: `Base ${militaryZones.length + 1}`,
        x: p.x,
        z: p.z,
        radius: 500,
        tier: "Tier 3",
        zoneType: "Complexo Militar Principal",
        pvpDanger: "Alto Risco",
        description: `Zona militar personalizada posicionada em X:${p.x} Z:${p.z}.`,
        structures: ["Quartel Militar", "Guaritas de Perímetro", "Paiol de Armas"],
        keyLoot: ["Fuzis de Assalto", "Coletes Táticos", "Munições", "Mochilas Militares"],
      };
      handleAddMilitaryZone(newZone);
      setAddingMilitaryZone(false);
      return;
    }

    if (!dragRef.current.hasMoved && addingPvpZone) {
      const p = toWorld(e.clientX, e.clientY);
      const newZone: PvpZone = {
        id: `pvp-${Date.now()}`,
        name: `Zona de PvP ${pvpZones.length + 1}`,
        shortName: `PVP ${pvpZones.length + 1}`,
        type: "pvp_allowed",
        x: p.x,
        z: p.z,
        radius: 750,
        enabled: true,
        schedule: "always",
        enterNotification: `⚠️ ATENÇÃO: Você entrou na Zona de PVP! Combate liberado!`,
        exitNotification: "🛡️ SEGURO: Você saiu da Zona de PVP! Dano entre jogadores DESATIVADO.",
        blockBulletDamageOutside: true,
        blockMeleeDamageOutside: true,
        color: "#ef4444",
      };
      const updated = [...pvpZones, newZone];
      setPvpZones(updated);
      savePvpZones(updated);
      setSelectedPvpZoneId(newZone.id);
      setSelectedMilitaryZone(null);
      setSel(null);
      setActiveTab("pvp");
      setAddingPvpZone(false);
      toast.success(`Zona de PvP "${newZone.name}" programada em X:${p.x} Z:${p.z}!`);
      return;
    }

    if (!dragRef.current.hasMoved && adding) {
      const p = toWorld(e.clientX, e.clientY);
      const m: Marker = {
        id: crypto.randomUUID(),
        name: `${adding} ${markers.length + 1}`,
        kind: adding,
        ...p,
        owner: "",
        members: "",
        notes: "",
        created: new Date().toLocaleDateString("pt-BR"),
      };
      save([...markers, m]);
      setSel(m.id);
      setSelectedMilitaryZone(null);
      setActiveTab("custom");
      setAdding(null);
      toast.success(`Marcador "${m.name}" criado em X:${p.x} Z:${p.z}!`);
    }
  };

  const upd = (patch: Partial<Marker>) =>
    save(markers.map((m) => (m.id === sel ? { ...m, ...patch } : m)));

  const visibleMarkers = useMemo(
    () =>
      markers.filter(
        (m) =>
          filter.has(m.kind) &&
          (m.name + m.owner + m.members + m.notes).toLowerCase().includes(search.toLowerCase()),
      ),
    [markers, filter, search],
  );

  const visibleMilitaryZones = useMemo(() => {
    return effectiveMilitaryZones.filter((z) => {
      if (militaryTierFilter === "GAS" && !z.tier.includes("Zona Tóxica")) return false;
      if (militaryTierFilter === "T4" && z.tier !== "Tier 4" && !z.tier.includes("Zona Tóxica"))
        return false;
      if (militaryTierFilter === "T3" && z.tier !== "Tier 3") return false;
      if (militaryTierFilter === "T2" && z.tier !== "Tier 2") return false;
      if (militaryTierFilter === "T1" && z.tier !== "Tier 1") return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const inLoot = z.keyLoot.some((l) => l.toLowerCase().includes(q));
      const inStruct = z.structures.some((s) => s.toLowerCase().includes(q));
      return (
        z.name.toLowerCase().includes(q) ||
        z.shortName.toLowerCase().includes(q) ||
        z.tier.toLowerCase().includes(q) ||
        z.zoneType.toLowerCase().includes(q) ||
        z.description.toLowerCase().includes(q) ||
        inLoot ||
        inStruct
      );
    });
  }, [effectiveMilitaryZones, militaryTierFilter, search]);

  const cur = markers.find((m) => m.id === sel);

  const exportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(markers, null, 2));
    toast.success("Marcadores copiados para a área de transferência!");
  };

  const importJson = () => {
    const t = prompt("Cole o JSON de marcadores:");
    if (!t) return;
    try {
      save(JSON.parse(t));
      toast.success("Marcadores importados com sucesso!");
    } catch {
      toast.error("JSON inválido");
    }
  };

  const copyCoords = (x: number, z: number, label?: string) => {
    navigator.clipboard.writeText(`${x} 0 ${z}`);
    toast.success(`Coordenadas de ${label ?? "posição"} copiadas: ${x} 0 ${z}`);
  };

  // Copia configuração XML de zona para DayZ (cfgeventspawns.xml / events.xml)
  const copyZoneEventXml = (zone: MilitaryZone) => {
    const xml = `<zone name="${zone.id}" smin="1" smax="3" dmin="1" dmax="5" x="${zone.x}.0" z="${zone.z}.0" r="${zone.radius}.0" /> <!-- ${zone.name} [${zone.tier}] -->`;
    navigator.clipboard.writeText(xml);
    toast.success(`Tag de Zona XML copiada para cfgeventspawns.xml!`);
  };

  // Copia formato de Safezone / Mod de Território
  const copySafezoneXml = (zone: MilitaryZone) => {
    const xml = `<zone name="${zone.name}" radius="${zone.radius}" x="${zone.x}" z="${zone.z}" pvp="${
      zone.pvpDanger.includes("Extremo") || zone.pvpDanger.includes("Alto") ? "true" : "false"
    }" />`;
    navigator.clipboard.writeText(xml);
    toast.success(`Tag de Território copiada: raio ${zone.radius}m`);
  };

  const convertZoneToMarker = (zone: MilitaryZone) => {
    const newMarker: Marker = {
      id: crypto.randomUUID(),
      name: zone.name,
      kind: "Zona PvP",
      x: zone.x,
      z: zone.z,
      owner: "",
      members: "",
      notes: `${zone.tier} · ${zone.zoneType} · Raio: ${zone.radius}m. ${zone.description}`,
      created: new Date().toLocaleDateString("pt-BR"),
    };
    save([...markers, newMarker]);
    setSel(newMarker.id);
    setSelectedMilitaryZone(null);
    setActiveTab("custom");
    toast.success(`Marcador de Zona criado em seus marcadores!`);
  };

  const getTierColor = (tier: MilitaryTier) => {
    if (tier.includes("Zona Tóxica"))
      return "border-emerald-500 bg-emerald-500/20 text-emerald-400";
    if (tier === "Tier 4") return "border-red-500 bg-red-500/20 text-red-400";
    if (tier === "Tier 3") return "border-amber-500 bg-amber-500/20 text-amber-400";
    if (tier === "Tier 2") return "border-lime-500 bg-lime-500/20 text-lime-400";
    return "border-sky-500 bg-sky-500/20 text-sky-400";
  };

  const getZonePinStyle = (tier: MilitaryTier, isSelected: boolean) => {
    if (tier.includes("Zona Tóxica")) {
      return {
        bg: "bg-emerald-600",
        border: isSelected
          ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-black"
          : "border border-emerald-300",
        glow: "shadow-[0_0_14px_rgba(16,185,129,0.8)]",
      };
    }
    if (tier === "Tier 4") {
      return {
        bg: "bg-red-600",
        border: isSelected
          ? "ring-2 ring-red-300 ring-offset-2 ring-offset-black"
          : "border border-red-300",
        glow: "shadow-[0_0_12px_rgba(239,68,68,0.8)]",
      };
    }
    if (tier === "Tier 3") {
      return {
        bg: "bg-amber-600",
        border: isSelected
          ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-black"
          : "border border-amber-300",
        glow: "shadow-[0_0_10px_rgba(245,158,11,0.7)]",
      };
    }
    if (tier === "Tier 2") {
      return {
        bg: "bg-lime-700",
        border: isSelected
          ? "ring-2 ring-lime-300 ring-offset-2 ring-offset-black"
          : "border border-lime-300",
        glow: "shadow-[0_0_8px_rgba(132,204,22,0.6)]",
      };
    }
    return {
      bg: "bg-sky-700",
      border: isSelected
        ? "ring-2 ring-sky-300 ring-offset-2 ring-offset-black"
        : "border border-sky-300",
      glow: "shadow-[0_0_8px_rgba(14,165,233,0.6)]",
    };
  };

  const getZoneRadiusStyle = (tier: MilitaryTier, isSelected: boolean) => {
    if (tier.includes("Zona Tóxica")) {
      return {
        bg: "radial-gradient(circle, rgba(16,185,129,0.32) 0%, rgba(16,185,129,0.15) 65%, rgba(16,185,129,0.02) 100%)",
        border: isSelected
          ? "border-2 border-dashed border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]"
          : "border border-dashed border-emerald-400/70",
        badge: "bg-emerald-950/90 text-emerald-300 border-emerald-600",
      };
    }
    if (tier === "Tier 4") {
      return {
        bg: "radial-gradient(circle, rgba(239,68,68,0.26) 0%, rgba(239,68,68,0.1) 70%, transparent 100%)",
        border: isSelected
          ? "border-2 border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.6)]"
          : "border border-red-500/60",
        badge: "bg-red-950/90 text-red-300 border-red-700",
      };
    }
    if (tier === "Tier 3") {
      return {
        bg: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.08) 70%, transparent 100%)",
        border: isSelected
          ? "border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          : "border border-amber-500/50",
        badge: "bg-amber-950/90 text-amber-300 border-amber-700",
      };
    }
    if (tier === "Tier 2") {
      return {
        bg: "radial-gradient(circle, rgba(132,204,22,0.16) 0%, rgba(132,204,22,0.05) 70%, transparent 100%)",
        border: isSelected
          ? "border-2 border-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.4)]"
          : "border border-lime-500/40",
        badge: "bg-lime-950/90 text-lime-300 border-lime-700",
      };
    }
    return {
      bg: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0.05) 70%, transparent 100%)",
      border: isSelected
        ? "border-2 border-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
        : "border border-sky-500/40",
      badge: "bg-sky-950/90 text-sky-300 border-sky-700",
    };
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_390px]">
      <div className="panel space-y-3 p-3">
        {/* Toolbar superior com camadas, zoom e adicionar marcadores */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Camadas:</span>

            {/* Toggle de Zonas Militares do Mapa */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-medium ${
                showMilitaryZones
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                  : "btn-ghost opacity-60"
              }`}
              onClick={() => setShowMilitaryZones((s) => !s)}
              title="Exibir ou ocultar as 25 zonas militares de Chernarus no mapa"
            >
              <ShieldAlert className="size-3.5 text-amber-400" />
              <span>Zonas Militares ({effectiveMilitaryZones.length})</span>
            </button>

            {/* Toggle dos Raios / Perímetros das Zonas Militares */}
            {showMilitaryZones && (
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-medium ${
                  showZoneRadii
                    ? "bg-primary/20 text-primary border border-primary/50 shadow-sm"
                    : "btn-ghost opacity-60"
                }`}
                onClick={() => setShowZoneRadii((s) => !s)}
                title="Exibir os círculos com o raio de influência em metros de cada zona militar"
              >
                <CircleDot className="size-3.5 text-primary" />
                <span>Raios das Zonas</span>
              </button>
            )}

            {/* Toggle de Cidades */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors ${
                showCities ? "btn-primary" : "btn-ghost opacity-60"
              }`}
              onClick={() => setShowCities((s) => !s)}
              title="Exibir nomes das cidades civis de Chernarus"
            >
              <Building2 className="size-3.5" />
              <span>Cidades ({CITIES.length})</span>
            </button>

            {/* Alternador de Estilo do Mapa Oficial DayZ: Topográfico vs Satélite */}
            <div className="flex items-center rounded-sm border border-border/80 bg-secondary/50 p-0.5 text-xs">
              <button
                className={`px-2 py-0.5 rounded-xs font-medium transition-colors ${
                  mapStyle === "topographic"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMapStyle("topographic")}
                title="Mapa Topográfico Oficial do DayZ (com curvas de nível, estradas, trilhas e relevo)"
              >
                🗺️ Topográfico
              </button>
              <button
                className={`px-2 py-0.5 rounded-xs font-medium transition-colors ${
                  mapStyle === "satellite"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMapStyle("satellite")}
                title="Mapa Satélite Oficial do DayZ (vista aérea foto-realista da vegetação e relevo)"
              >
                🛰️ Satélite
              </button>
            </div>

            {/* Toggle de Zonas de PvP e Safezones */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-medium ${
                showPvpZones
                  ? "bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm font-semibold"
                  : "btn-ghost opacity-60"
              }`}
              onClick={() => setShowPvpZones((s) => !s)}
              title="Exibir ou ocultar zonas de PvP e combate liberado no mapa"
            >
              <Swords className="size-3.5 text-red-400" />
              <span>Zonas de PvP ({pvpZones.length})</span>
            </button>

            {/* Alternador de Modo Ultra-HD Dinâmico (Nitidez Máxima de Zoom) */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-medium ${
                ultraHd
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm font-semibold"
                  : "btn-ghost opacity-60"
              }`}
              onClick={() => {
                setUltraHd((u) => !u);
                toast.info(
                  ultraHd
                    ? "Modo Ultra-HD desativado"
                    : "⚡ Modo Ultra-HD Dinâmico ativado! Nitidez máxima preservada ao dar zoom.",
                );
              }}
              title="Preserva nitidez máxima e alta definição de imagem ao dar zoom no mapa"
            >
              <Zap className="size-3.5 text-sky-400" />
              <span>Ultra-HD {ultraHd ? "Ativo" : "Off"}</span>
            </button>

            {/* Botão Rápido de Raid de Bases (Ativar / Desativar Danos) */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-bold border ${
                raidConfig.raidEnabled
                  ? "bg-amber-500/25 text-amber-300 border-amber-500 shadow-sm animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/60"
              }`}
              onClick={() => handleToggleRaidQuick(!raidConfig.raidEnabled)}
              title="Ativar ou desativar dano em estruturas de base (Raid) no servidor"
            >
              {raidConfig.raidEnabled ? (
                <Bomb className="size-3.5 text-amber-400" />
              ) : (
                <Shield className="size-3.5 text-emerald-400" />
              )}
              <span>Raid: {raidConfig.raidEnabled ? "Ativado" : "Desativado"}</span>
            </button>

            {/* Gerador de Script init.c */}
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-semibold bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30"
              onClick={() => setShowInitScriptModal(true)}
              title="Gerar script de init.c para o servidor com proteção de PvP e Raid"
            >
              <FileCode className="size-3.5 text-primary" />
              <span>Código init.c</span>
            </button>

            <div className="h-4 w-px bg-border/80 mx-0.5 hidden sm:block" />

            {/* Botão de Destaque para Configurar Chance de Drop */}
            <button
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-sm transition-all font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm hover:bg-emerald-500/30 active:scale-95 cursor-pointer"
              onClick={() => {
                const targetZoneId =
                  (currentSelectedZone ?? effectiveMilitaryZones[0])?.id ?? "tisy";
                setModalSelectedZoneId(targetZoneId);
                setShowDropChanceModal(true);
              }}
              title="Abrir painel para alterar a % de chance de drop dos itens de qualquer zona militar"
            >
              <Percent className="size-3.5 text-emerald-400" />
              <span>Chance de Drop (%)</span>
            </button>
          </div>

          {/* Controles de Zoom do Toolbar */}
          <div className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-sm border border-border/40">
            <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
              <Move className="size-3 text-primary" /> Zoom:
            </span>
            <button
              className="btn-ghost size-6 p-0 flex items-center justify-center font-bold text-sm"
              onClick={() => handleZoomChange(zoom - 0.5)}
              title="Diminuir Zoom"
            >
              −
            </button>
            <span className="w-10 text-center font-mono text-xs font-semibold">
              {zoom.toFixed(1)}x
            </span>
            <button
              className="btn-ghost size-6 p-0 flex items-center justify-center font-bold text-sm"
              onClick={() => handleZoomChange(zoom + 0.5)}
              title="Aumentar Zoom"
            >
              +
            </button>
            <div className="h-4 w-px bg-border/80 mx-1" />
            <button
              className="btn-ghost text-[11px] px-2 py-0.5 flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
              onClick={resetView}
              title="Centralizar mapa e remover deslocamento"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Barra de Filtro de Tiers das Zonas Militares quando a camada estiver ativa */}
        {showMilitaryZones && (
          <div className="flex flex-wrap items-center gap-1 bg-secondary/30 p-1.5 rounded-sm border border-border/40 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Crosshair className="size-3 text-primary" /> Tiers de Zona:
            </span>
            {[
              { id: "ALL", label: `Todas as Zonas (${effectiveMilitaryZones.length})` },
              {
                id: "GAS",
                label: `Gás NBC (${effectiveMilitaryZones.filter((b) => b.tier.includes("Zona Tóxica")).length})`,
                color: "text-emerald-400",
              },
              {
                id: "T4",
                label: `Tier 4 (${effectiveMilitaryZones.filter((b) => b.tier.includes("Tier 4")).length})`,
                color: "text-red-400",
              },
              {
                id: "T3",
                label: `Tier 3 (${effectiveMilitaryZones.filter((b) => b.tier === "Tier 3").length})`,
                color: "text-amber-400",
              },
              {
                id: "T2",
                label: `Tier 2 (${effectiveMilitaryZones.filter((b) => b.tier === "Tier 2").length})`,
                color: "text-lime-400",
              },
              {
                id: "T1",
                label: `Tier 1 (${effectiveMilitaryZones.filter((b) => b.tier === "Tier 1").length})`,
                color: "text-sky-400",
              },
            ].map((t) => (
              <button
                key={t.id}
                className={`px-2 py-0.5 rounded-sm transition-all ${
                  militaryTierFilter === t.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : `btn-ghost hover:bg-secondary ${t.color ?? "text-muted-foreground"}`
                }`}
                onClick={() => setMilitaryTierFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Criar Marcador Personalizado */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Novo Marcador:</span>
          {KINDS.map((k) => (
            <button
              key={k}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs transition-colors ${
                adding === k ? "btn-primary ring-1 ring-primary font-semibold" : "btn-ghost"
              }`}
              onClick={() => setAdding(adding === k ? null : k)}
            >
              <span className="size-2 rounded-full" style={{ background: COLORS[k] }} />
              {k}
            </button>
          ))}
          {adding && (
            <span className="ml-auto text-xs text-primary animate-pulse font-medium">
              Clique no mapa para marcar: {adding}
            </span>
          )}
        </div>

        {/* Contêiner Interativo do Mapa (Arrastar com Mouse, Zoom, Sem Bordas Pretas) */}
        <div
          ref={containerRef}
          className={`relative h-[650px] md:h-[720px] w-full overflow-hidden rounded-sm border border-border bg-[#10242e] shadow-inner select-none touch-none ${
            repositioningZone || addingMilitaryZone || addingPvpZone || adding
              ? "cursor-crosshair"
              : isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => {
            setIsDragging(false);
            setHover(null);
          }}
        >
          {/* Banner Flutuante de Modo Reposicionamento ou Adicionar */}
          {repositioningZone && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-card/95 border-2 border-primary px-3.5 py-1.5 rounded-md shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 pointer-events-auto">
              <div className="p-1 rounded-full bg-primary/20 text-primary animate-bounce">
                <MapPin className="size-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>Mudar Posição:</span>
                  <span className="text-primary font-bold">
                    {repositioningZone.type === "military"
                      ? militaryZones.find((z) => z.id === repositioningZone.id)?.shortName ??
                        "Zona Militar"
                      : pvpZones.find((z) => z.id === repositioningZone.id)?.shortName ??
                        "Zona de PvP"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Clique em qualquer lugar do mapa de Chernarus para reposicionar
                </span>
              </div>
              <button
                className="btn-ghost text-xs px-2 py-0.5 border border-border/70 ml-1.5 hover:bg-secondary font-medium"
                onClick={() => setRepositioningZone(null)}
              >
                Cancelar (ESC)
              </button>
            </div>
          )}

          {addingMilitaryZone && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-card/95 border-2 border-amber-500 px-3.5 py-1.5 rounded-md shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 pointer-events-auto">
              <div className="p-1 rounded-full bg-amber-500/20 text-amber-400 animate-bounce">
                <ShieldAlert className="size-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-300">Nova Zona Militar / Loot</div>
                <span className="text-[10px] text-muted-foreground">
                  Clique em qualquer lugar do mapa para posicionar a nova zona militar
                </span>
              </div>
              <button
                className="btn-ghost text-xs px-2 py-0.5 border border-border/70 ml-1.5 hover:bg-secondary font-medium"
                onClick={() => setAddingMilitaryZone(false)}
              >
                Cancelar (ESC)
              </button>
            </div>
          )}

          {/* Barra Flutuante de Ajuste Rápido de Área e Posição da Zona Militar no Mapa */}
          {currentSelectedZone && (
            <div
              className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 rounded-sm bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur-md border border-amber-500/50 text-xs pointer-events-auto animate-in fade-in-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-foreground">{currentSelectedZone.shortName}</span>
                <span className="text-muted-foreground text-[10px] font-mono">
                  X:{currentSelectedZone.x} Z:{currentSelectedZone.z}
                </span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  r={currentSelectedZone.radius}m
                </span>
              </div>

              <div className="h-4 w-px bg-border/80 mx-0.5 hidden sm:block" />

              <div className="flex items-center gap-1">
                {/* Botão de Reposicionar no Mapa */}
                <button
                  className={`btn-ghost h-6 px-2 text-[11px] font-bold border flex items-center gap-1 ${
                    repositioningZone?.id === currentSelectedZone.id
                      ? "bg-amber-500 text-black border-amber-400 animate-pulse"
                      : "border-amber-500/40 text-amber-300 hover:bg-amber-500/15"
                  }`}
                  onClick={() =>
                    setRepositioningZone((cur) =>
                      cur?.id === currentSelectedZone.id
                        ? null
                        : { type: "military", id: currentSelectedZone.id },
                    )
                  }
                  title="Clique no mapa para reposicionar o centro desta zona"
                >
                  <LocateFixed className="size-3" />
                  {repositioningZone?.id === currentSelectedZone.id ? "Clique..." : "Mover"}
                </button>

                <span className="text-[10px] text-muted-foreground mr-0.5 hidden md:inline">
                  Área:
                </span>
                <button
                  className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                  onClick={() =>
                    handleUpdateZoneRadius(currentSelectedZone.id, currentSelectedZone.radius - 100)
                  }
                  title="Diminuir área em 100 metros"
                >
                  − 100m
                </button>
                <button
                  className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                  onClick={() =>
                    handleUpdateZoneRadius(currentSelectedZone.id, currentSelectedZone.radius - 50)
                  }
                  title="Diminuir área em 50 metros"
                >
                  − 50m
                </button>
                <button
                  className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                  onClick={() =>
                    handleUpdateZoneRadius(currentSelectedZone.id, currentSelectedZone.radius + 50)
                  }
                  title="Aumentar área em 50 metros"
                >
                  + 50m
                </button>
                <button
                  className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                  onClick={() =>
                    handleUpdateZoneRadius(currentSelectedZone.id, currentSelectedZone.radius + 100)
                  }
                  title="Aumentar área em 100 metros"
                >
                  + 100m
                </button>

                {/* Reset para o original se alterado */}
                {(() => {
                  const defaultZ = MILITARY_ZONES.find((d) => d.id === currentSelectedZone.id);
                  const orig = defaultZ ? defaultZ.radius : currentSelectedZone.radius;
                  if (currentSelectedZone.radius === orig) return null;
                  return (
                    <button
                      className="btn-ghost size-6 p-0 text-muted-foreground hover:text-foreground text-xs ml-0.5"
                      onClick={() => handleResetZoneRadius(currentSelectedZone.id)}
                      title={`Restaurar raio padrão (${orig}m)`}
                    >
                      <RotateCcw className="size-3" />
                    </button>
                  );
                })()}

                {/* Botão de Excluir / Tirar Zona Militar */}
                <button
                  className="btn-danger size-6 p-0 text-xs ml-1"
                  onClick={() => handleDeleteMilitaryZone(currentSelectedZone.id)}
                  title="Excluir / Tirar Zona Militar do Mapa"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* Estágio do Mapa transformado com Translate3D e Scale (100% preenchido sem bordas pretas) */}
          <div
            className="absolute top-0 left-0 origin-top-left pointer-events-auto"
            style={{
              width: `${currentSize}px`,
              height: `${currentSize}px`,
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
              transition: isDragging ? "none" : "transform 0.08s ease-out",
              willChange: isDragging ? "transform" : "auto",
            }}
          >
            <img
              src={mapStyle === "satellite" ? mapImgSat : mapImg}
              alt="Mapa Oficial DayZ Chernarus+"
              width={4096}
              height={4096}
              className="size-full select-none pointer-events-none object-cover"
              style={{
                imageRendering: "auto",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              draggable={false}
            />

            {/* Camada Dinâmica Slippy Tiles Ultra-HD (Nitidez máxima sem perda de qualidade ao dar zoom) */}
            {ultraHd &&
              visibleTiles.map((t) => {
                const numTiles = 1 << t.z;
                const styleFolder =
                  mapStyle === "satellite" ? "ChernarusPlus-Sat" : "ChernarusPlus-Top";
                return (
                  <img
                    key={t.key}
                    src={`https://maps.izurvive.com/maps/${styleFolder}/1.25.0/tiles/${t.z}/${t.x}/${t.y}.webp`}
                    alt=""
                    width={256}
                    height={256}
                    className="pointer-events-none absolute select-none"
                    style={{
                      left: `${(t.x / numTiles) * 100}%`,
                      top: `${(t.y / numTiles) * 100}%`,
                      width: `${(1 / numTiles) * 100}%`,
                      height: `${(1 / numTiles) * 100}%`,
                      imageRendering: "auto",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                    draggable={false}
                    loading="eager"
                  />
                );
              })}

            {/* Grade Tática de Coordenadas */}
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "linear-gradient(to right, color-mix(in oklab, var(--foreground) 15%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 15%, transparent) 1px, transparent 1px)",
                backgroundSize: "10% 10%",
              }}
            />

            {/* Cidades Civis */}
            {showCities &&
              CITIES.map(([name, x, z]) => (
                <span
                  key={name}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center select-none"
                  style={{ left: `${(x / SIZE) * 100}%`, top: `${(1 - z / SIZE) * 100}%` }}
                >
                  <span className="mx-auto block size-1.5 rounded-full bg-foreground/70" />
                  <span className="whitespace-nowrap rounded-xs bg-background/80 px-1 py-0.5 text-[9px] font-medium tracking-tight shadow-xs backdrop-blur-xs">
                    {name}
                  </span>
                </span>
              ))}

            {/* Camada Visual de Raios / Perímetros das Zonas Militares no Mapa */}
            {showMilitaryZones &&
              showZoneRadii &&
              visibleMilitaryZones.map((z) => {
                const isSelected = selectedMilitaryZone?.id === z.id;
                const radiusStyle = getZoneRadiusStyle(z.tier, isSelected);
                // Diâmetro percentual em relação ao tamanho total do Chernarus (15.360m)
                const diameterPercent = ((z.radius * 2) / SIZE) * 100;

                return (
                  <div
                    key={`radius-${z.id}`}
                    className={`pointer-events-none absolute rounded-full -translate-x-1/2 -translate-y-1/2 flex items-start justify-center transition-all ${
                      radiusStyle.border
                    } ${isSelected ? "z-10" : "z-0"}`}
                    style={{
                      left: `${(z.x / SIZE) * 100}%`,
                      top: `${(1 - z.z / SIZE) * 100}%`,
                      width: `${diameterPercent}%`,
                      height: `${diameterPercent}%`,
                      background: radiusStyle.bg,
                    }}
                  >
                    {/* Tag com Raio em Metros no topo da circunferência */}
                    <span
                      className={`-translate-y-1/2 whitespace-nowrap rounded-xs px-1 py-0.2 text-[8px] font-mono font-bold border shadow-xs opacity-75 group-hover:opacity-100 ${radiusStyle.badge}`}
                    >
                      {z.radius}m
                    </span>
                  </div>
                );
              })}

            {/* Pinos Táticos Interativos das Zonas Militares de Chernarus */}
            {showMilitaryZones &&
              visibleMilitaryZones.map((z) => {
                const isSelected = selectedMilitaryZone?.id === z.id;
                const pin = getZonePinStyle(z.tier, isSelected);
                const isToxic = z.tier.includes("Zona Tóxica");

                return (
                  <button
                    key={z.id}
                    title={`${z.name} (${z.tier}) · Raio: ${z.radius}m\nClique para inspecionar loot, perigos e gerar XML`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMilitaryZone(z);
                      setSel(null);
                      setActiveTab("military");
                    }}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none z-10 ${
                      isSelected ? "scale-125 z-20" : ""
                    }`}
                    style={{ left: `${(z.x / SIZE) * 100}%`, top: `${(1 - z.z / SIZE) * 100}%` }}
                  >
                    <div
                      className={`relative flex items-center justify-center size-5 rounded-full ${pin.bg} ${pin.border} ${pin.glow} text-white`}
                    >
                      {isToxic ? (
                        <Skull className="size-3 text-emerald-100 animate-pulse" />
                      ) : z.tier === "Tier 4" ? (
                        <ShieldAlert className="size-3 text-red-100" />
                      ) : (
                        <Crosshair className="size-3 text-white" />
                      )}

                      {/* Tag do Nome da Zona Militar, Tier e Raio */}
                      <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 whitespace-nowrap rounded-xs bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-md backdrop-blur-sm border border-border/80">
                        <span className="font-semibold text-foreground">{z.shortName}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-xs font-mono font-bold ${
                            isToxic
                              ? "bg-emerald-900/60 text-emerald-300"
                              : z.tier === "Tier 4"
                                ? "bg-red-900/60 text-red-300"
                                : z.tier === "Tier 3"
                                  ? "bg-amber-900/60 text-amber-300"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isToxic ? "GÁS NBC" : z.tier.replace("Tier ", "T")}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {z.radius}m
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

            {/* Camada Visual de Raios / Perímetros das Zonas de PvP e Safezones */}
            {showPvpZones &&
              pvpZones.map((pz) => {
                const isSelected = selectedPvpZoneId === pz.id;
                const diameterPercent = ((pz.radius * 2) / SIZE) * 100;
                const isPvp = pz.type === "pvp_allowed";

                return (
                  <div
                    key={`pvp-radius-${pz.id}`}
                    className={`pointer-events-none absolute rounded-full -translate-x-1/2 -translate-y-1/2 flex items-start justify-center transition-all ${
                      isSelected ? "z-20 ring-2 ring-white/70" : "z-10"
                    } ${
                      isPvp
                        ? "border-2 border-dashed border-red-500/80 shadow-[0_0_24px_rgba(239,68,68,0.45)]"
                        : "border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                    }`}
                    style={{
                      left: `${(pz.x / SIZE) * 100}%`,
                      top: `${(1 - pz.z / SIZE) * 100}%`,
                      width: `${diameterPercent}%`,
                      height: `${diameterPercent}%`,
                      background: isPvp
                        ? "radial-gradient(circle, rgba(239,68,68,0.32) 0%, rgba(220,38,38,0.14) 70%, transparent 100%)"
                        : "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.12) 70%, transparent 100%)",
                    }}
                  >
                    <span
                      className={`-translate-y-1/2 whitespace-nowrap rounded-xs px-1.5 py-0.5 text-[9px] font-mono font-bold border shadow-md flex items-center gap-1 ${
                        isPvp
                          ? "bg-red-950/90 text-red-200 border-red-500"
                          : "bg-emerald-950/90 text-emerald-200 border-emerald-500"
                      }`}
                    >
                      {isPvp ? "⚔️ PVP LIBERADO" : "🛡️ SAFEZONE PVE"} · {pz.radius}m
                    </span>
                  </div>
                );
              })}

            {/* Pinos Táticos Interativos das Zonas de PvP */}
            {showPvpZones &&
              pvpZones.map((pz) => {
                const isSelected = selectedPvpZoneId === pz.id;
                const isPvp = pz.type === "pvp_allowed";

                return (
                  <button
                    key={`pvp-pin-${pz.id}`}
                    title={`${pz.name}\n${isPvp ? "⚔️ Zona de PvP Liberado" : "🛡️ SafeZone PvE"}\nRaio: ${pz.radius}m\nClique para inspecionar e programar`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPvpZoneId(pz.id);
                      setSelectedMilitaryZone(null);
                      setSel(null);
                      setActiveTab("pvp");
                    }}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none z-20 ${
                      isSelected
                        ? "scale-125 z-30 ring-2 ring-white ring-offset-2 ring-offset-black rounded-full"
                        : ""
                    }`}
                    style={{
                      left: `${(pz.x / SIZE) * 100}%`,
                      top: `${(1 - pz.z / SIZE) * 100}%`,
                    }}
                  >
                    <div
                      className={`relative flex items-center justify-center size-6 rounded-full shadow-lg text-white font-bold ${
                        isPvp
                          ? "bg-red-600 border border-red-300 shadow-[0_0_14px_rgba(239,68,68,0.9)] animate-pulse"
                          : "bg-emerald-600 border border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                      }`}
                    >
                      {isPvp ? (
                        <Crosshair className="size-3.5 text-white" />
                      ) : (
                        <ShieldCheck className="size-3.5 text-white" />
                      )}

                      <div className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 flex items-center gap-1 whitespace-nowrap rounded-xs bg-background/95 px-2 py-0.5 text-[10px] font-medium shadow-lg backdrop-blur-md border border-border">
                        <span className="font-bold text-foreground">{pz.shortName}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-xs font-mono font-bold ${
                            isPvp
                              ? "bg-red-950 text-red-300 border border-red-700"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          }`}
                        >
                          {isPvp ? "PVP" : "SAFE"}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {pz.radius}m
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

            {/* Marcadores Personalizados do Usuário */}
            {visibleMarkers.map((m) => {
              const isSelected = sel === m.id;
              return (
                <button
                  key={m.id}
                  title={`${m.name} (${m.kind})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSel(m.id);
                    setSelectedMilitaryZone(null);
                    setActiveTab("custom");
                  }}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none z-10 ${
                    isSelected ? "scale-125 z-20" : ""
                  }`}
                  style={{ left: `${(m.x / SIZE) * 100}%`, top: `${(1 - m.z / SIZE) * 100}%` }}
                >
                  <span
                    className={`block size-4 rounded-full border-2 border-background shadow-md ${
                      isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-black" : ""
                    }`}
                    style={{ background: COLORS[m.kind] }}
                  />
                  <span className="pointer-events-none absolute left-5 top-0 whitespace-nowrap rounded-xs bg-background/90 px-1.5 py-0.5 text-[10px] border border-border/60 shadow-sm">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barra Flutuante de Ajuste Rápido de Área da Zona de PvP no Mapa */}
          {currentSelectedPvpZone && (
            <div
              className="absolute top-14 left-3 z-30 flex flex-wrap items-center gap-2 rounded-sm bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur-md border border-red-500/50 text-xs pointer-events-auto animate-in fade-in-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                <Crosshair className="size-3.5 text-red-400 shrink-0" />
                <span className="font-bold text-foreground">
                  {currentSelectedPvpZone.shortName}
                </span>
                <span className="text-muted-foreground text-[10px] font-mono">
                  X:{currentSelectedPvpZone.x} Z:{currentSelectedPvpZone.z}
                </span>
                <span className="font-mono font-bold text-red-400 text-xs">
                  {currentSelectedPvpZone.radius}m
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Botão Mover */}
                <button
                  className={`btn-ghost h-6 px-2 text-[11px] font-bold border flex items-center gap-1 ${
                    repositioningZone?.id === currentSelectedPvpZone.id
                      ? "bg-red-600 text-white border-red-400 animate-pulse"
                      : "border-red-500/40 text-red-300 hover:bg-red-500/15"
                  }`}
                  onClick={() =>
                    setRepositioningZone((cur) =>
                      cur?.id === currentSelectedPvpZone.id
                        ? null
                        : { type: "pvp", id: currentSelectedPvpZone.id },
                    )
                  }
                  title="Clique no mapa para reposicionar esta zona de PvP"
                >
                  <LocateFixed className="size-3" />
                  {repositioningZone?.id === currentSelectedPvpZone.id ? "Clique..." : "Mover"}
                </button>
                <button
                  className="btn-ghost size-6 p-0 text-xs font-bold"
                  onClick={() =>
                    handleUpdatePvpZoneRadius(
                      currentSelectedPvpZone.id,
                      currentSelectedPvpZone.radius - 50,
                    )
                  }
                  title="Diminuir raio em 50m"
                >
                  −
                </button>
                <input
                  type="range"
                  min={100}
                  max={3000}
                  step={25}
                  value={currentSelectedPvpZone.radius}
                  onChange={(e) =>
                    handleUpdatePvpZoneRadius(currentSelectedPvpZone.id, Number(e.target.value))
                  }
                  className="w-24 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <button
                  className="btn-ghost size-6 p-0 text-xs font-bold"
                  onClick={() =>
                    handleUpdatePvpZoneRadius(
                      currentSelectedPvpZone.id,
                      currentSelectedPvpZone.radius + 50,
                    )
                  }
                  title="Aumentar raio em 50m"
                >
                  +
                </button>
                <button
                  className="btn-danger size-6 p-0 text-xs ml-1"
                  onClick={() => handleDeletePvpZone(currentSelectedPvpZone.id)}
                  title="Remover Zona de PvP"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* HUD Flutuante Superior Esquerdo: Coordenadas em Tempo Real */}
          <div className="pointer-events-none absolute top-3 left-3 z-30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md px-2.5 py-1.5 rounded-sm border border-border/80 shadow-md">
              <Crosshair className="size-3.5 text-primary shrink-0" />
              {hover ? (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-foreground font-bold">
                    X: {hover.x.toString().padStart(5, "0")} · Z:{" "}
                    {hover.z.toString().padStart(5, "0")}
                  </span>
                  <span className="text-[10px] px-1 py-0.2 rounded-xs bg-primary/20 text-primary font-bold">
                    GRID [
                    {Math.floor(hover.x / 100)
                      .toString()
                      .padStart(3, "0")}{" "}
                    {Math.floor(hover.z / 100)
                      .toString()
                      .padStart(3, "0")}
                    ]
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">
                  Mova o mouse sobre Chernarus
                </span>
              )}
            </div>
            {addingPvpZone && (
              <div className="bg-red-600 text-white px-2.5 py-1 rounded-xs text-[11px] font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
                <Crosshair className="size-3.5" />
                Clique no mapa para posicionar a nova Zona de PvP!
              </div>
            )}
            {adding && (
              <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-xs text-[11px] font-semibold shadow-md flex items-center gap-1.5 animate-pulse">
                <span className="size-1.5 rounded-full bg-white" />
                Clique no mapa para marcar: {adding}
              </div>
            )}
          </div>

          {/* HUD Flutuante Superior Direito: Controles de Zoom & Atalhos Rápidos */}
          <div className="pointer-events-auto absolute top-3 right-3 z-30 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-sm border border-border/80 shadow-md">
              <button
                className="btn-ghost size-7 p-0 flex items-center justify-center text-foreground hover:text-primary font-bold transition-transform active:scale-95"
                onClick={() => handleZoomChange(zoom + 0.5)}
                title="Aumentar Zoom (+)"
              >
                <ZoomIn className="size-4" />
              </button>
              <span className="w-10 text-center font-mono text-xs font-bold text-foreground">
                {zoom.toFixed(1)}x
              </span>
              <button
                className="btn-ghost size-7 p-0 flex items-center justify-center text-foreground hover:text-primary font-bold transition-transform active:scale-95"
                onClick={() => handleZoomChange(zoom - 0.5)}
                title="Diminuir Zoom (−)"
              >
                <ZoomOut className="size-4" />
              </button>
              <div className="h-4 w-px bg-border/80 mx-0.5" />
              <button
                className="btn-ghost size-7 p-0 flex items-center justify-center text-foreground hover:text-primary transition-transform active:scale-95"
                onClick={resetView}
                title="Centralizar e ajustar mapa (Reset)"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Atalhos Rápidos de Zoom */}
            <div className="flex items-center gap-1 bg-background/85 backdrop-blur-md px-1.5 py-0.5 rounded-sm border border-border/70 text-[10px] shadow-sm">
              <span className="text-muted-foreground mr-0.5 font-semibold">Zoom:</span>
              {[1, 1.5, 2.5, 4, 6, 8].map((zVal) => (
                <button
                  key={zVal}
                  onClick={() => handleZoomChange(zVal)}
                  className={`px-1.5 py-0.5 rounded-xs font-mono font-semibold transition-all ${
                    Math.abs(zoom - zVal) < 0.2
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {zVal}x
                </button>
              ))}
            </div>
          </div>

          {/* Dica Flutuante Inferior: Navegação com Mouse e Visualização de Zonas */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex items-center gap-2 bg-background/85 backdrop-blur-md px-2.5 py-1 rounded-sm border border-border/70 shadow-sm text-[11px] text-muted-foreground">
            <Compass className="size-3.5 text-primary shrink-0" />
            <span>
              🖱️ Clique e arraste para mover · Roda do mouse para zoom · Raios circulares das zonas
              militares
            </span>
          </div>
        </div>

        {/* Rodapé de Coordenadas e Dica */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1">
          <p className="font-mono flex items-center gap-1.5">
            <Compass className="size-3.5 text-primary" />
            {hover ? (
              <span className="text-foreground font-semibold">
                X: {hover.x} · Z: {hover.z}
              </span>
            ) : (
              "Passe o mouse no mapa para inspecionar coordenadas"
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Clique em qualquer zona militar para ver o raio de cobertura, loot exclusivo e exportar
            XML para o servidor.
          </p>
        </div>
      </div>

      {/* Painel Lateral de Informações e Listagens */}
      <aside className="space-y-3">
        {/* Card de Detalhes: Zona Militar Selecionada */}
        {currentSelectedZone ? (
          <div className="panel space-y-3 p-3.5 border-amber-500/40 bg-card shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-xs border ${getTierColor(
                      currentSelectedZone.tier,
                    )}`}
                  >
                    {currentSelectedZone.tier}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-secondary rounded-xs border border-border text-foreground">
                    Raio: {currentSelectedZone.radius}m
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ~{(Math.PI * Math.pow(currentSelectedZone.radius / 1000, 2)).toFixed(2)} km²
                  </span>
                </div>
                <h3 className="font-display text-base text-foreground mt-1.5 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="size-4 text-amber-400 shrink-0" />
                  {currentSelectedZone.name}
                </h3>
                <span className="text-xs text-muted-foreground block">
                  {currentSelectedZone.zoneType}
                </span>
              </div>
              <button
                className="btn-ghost size-7 p-0 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setSelectedMilitaryZone(null)}
                title="Fechar detalhes"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentSelectedZone.description}
            </p>

            {/* Painel Exclusivo de Controle de Área e Raio da Zona Militar (Diminuir / Aumentar) */}
            <div className="rounded-sm bg-amber-500/10 p-3 border border-amber-500/40 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Ruler className="size-4 text-amber-400" />
                  <span>Área & Raio da Zona</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold bg-background/80 px-2 py-0.5 rounded-xs border border-amber-500/40 text-foreground">
                    {currentSelectedZone.radius}m
                  </span>
                  {(() => {
                    const defaultZ = MILITARY_ZONES.find((d) => d.id === currentSelectedZone.id);
                    const orig = defaultZ ? defaultZ.radius : currentSelectedZone.radius;
                    const diff = currentSelectedZone.radius - orig;
                    if (diff === 0) return null;
                    return (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs border ${
                          diff > 0
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                            : "bg-red-950/80 text-red-300 border-red-700"
                        }`}
                        title={`Raio original: ${orig}m`}
                      >
                        {diff > 0 ? `+${diff}m` : `${diff}m`}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Informações de Superfície e Cobertura */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-background/50 px-2 py-1 rounded-xs border border-border/40 font-mono">
                <span>Superfície de Spawn:</span>
                <span className="text-foreground font-semibold">
                  ~{(Math.PI * Math.pow(currentSelectedZone.radius / 1000, 2)).toFixed(2)} km² (
                  {Math.round((Math.PI * Math.pow(currentSelectedZone.radius, 2)) / 10000)} ha)
                </span>
              </div>

              {/* Slider de Redimensionamento Interativo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>50m (Muito Pequeno)</span>
                  <span className="text-amber-300 font-semibold">
                    Arraste para diminuir/aumentar
                  </span>
                  <span>5.000m (Enorme)</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="25"
                  value={currentSelectedZone.radius}
                  onChange={(e) => handleUpdateZoneRadius(currentSelectedZone.id, +e.target.value)}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-secondary rounded-lg"
                  title={`Raio atual: ${currentSelectedZone.radius}m`}
                />
              </div>

              {/* Botões Rápidos de Diminuir e Aumentar Raio */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Botões para Diminuir */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Diminuir:
                    </span>
                    <button
                      className="btn-ghost flex-1 h-7 text-xs font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(
                          currentSelectedZone.id,
                          currentSelectedZone.radius - 250,
                        )
                      }
                      title="Diminuir área em 250m"
                    >
                      − 250m
                    </button>
                    <button
                      className="btn-ghost flex-1 h-7 text-xs font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(
                          currentSelectedZone.id,
                          currentSelectedZone.radius - 100,
                        )
                      }
                      title="Diminuir área em 100m"
                    >
                      − 100m
                    </button>
                    <button
                      className="btn-ghost flex-1 h-7 text-xs font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(
                          currentSelectedZone.id,
                          currentSelectedZone.radius - 50,
                        )
                      }
                      title="Diminuir área em 50m"
                    >
                      − 50m
                    </button>
                  </div>

                  {/* Botões para Aumentar */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Aumentar:
                    </span>
                    <button
                      className="btn-ghost flex-1 h-7 text-xs font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(
                          currentSelectedZone.id,
                          currentSelectedZone.radius + 50,
                        )
                      }
                      title="Aumentar área em 50m"
                    >
                      + 50m
                    </button>
                    <button
                      className="btn-ghost flex-1 h-7 text-xs font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(
                          currentSelectedZone.id,
                          currentSelectedZone.radius + 100,
                        )
                      }
                      title="Aumentar área em 100m"
                    >
                      + 100m
                    </button>
                    <button
                      className="btn-ghost flex-1 h-7 text-xs font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(
                          currentSelectedZone.id,
                          currentSelectedZone.radius + 250,
                        )
                      }
                      title="Aumentar área em 250m"
                    >
                      + 250m
                    </button>
                  </div>
                </div>

                {/* Presets Rápidos e Campo de Digitação Direta */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-border/40">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Presets:</span>
                    {[
                      { label: "300m", r: 300 },
                      { label: "600m", r: 600 },
                      { label: "1.000m", r: 1000 },
                      { label: "1.500m", r: 1500 },
                      { label: "2.500m", r: 2500 },
                      { label: "4.000m", r: 4000 },
                    ].map((pr) => (
                      <button
                        key={pr.r}
                        className={`px-1.5 py-0.5 text-[10px] rounded-xs font-mono font-medium border transition-colors ${
                          currentSelectedZone.radius === pr.r
                            ? "bg-amber-500 text-black border-amber-400 font-bold"
                            : "bg-secondary/70 hover:bg-secondary text-muted-foreground border-border/60"
                        }`}
                        onClick={() => handleUpdateZoneRadius(currentSelectedZone.id, pr.r)}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        step="50"
                        value={currentSelectedZone.radius}
                        onChange={(e) =>
                          handleUpdateZoneRadius(currentSelectedZone.id, +e.target.value)
                        }
                        className="field w-18 h-7 text-center font-mono text-xs pr-4 font-bold bg-background"
                        title="Digite o raio exato em metros"
                      />
                      <span className="absolute right-1 text-[10px] text-muted-foreground pointer-events-none">
                        m
                      </span>
                    </div>

                    {(() => {
                      const defaultZ = MILITARY_ZONES.find((d) => d.id === currentSelectedZone.id);
                      const orig = defaultZ ? defaultZ.radius : currentSelectedZone.radius;
                      const isChanged = currentSelectedZone.radius !== orig;
                      if (!isChanged) return null;
                      return (
                        <button
                          className="btn-ghost h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border/60"
                          onClick={() => handleResetZoneRadius(currentSelectedZone.id)}
                          title={`Restaurar raio padrão original (${orig}m)`}
                        >
                          <RotateCcw className="size-2.5" />
                          Padrão ({orig}m)
                        </button>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-tight pt-0.5">
                  💡 O raio da zona define o perímetro no mapa de Chernarus onde spawnam armas,
                  itens e eventos militares (cfgeventspawns.xml / safezones).
                </p>
              </div>
            </div>

            {/* Botão Principal de Destaque: Mudar Chance de Drop da Zona */}
            <button
              className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2 font-bold shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-transform active:scale-98"
              onClick={() => {
                setModalSelectedZoneId(currentSelectedZone.id);
                setShowDropChanceModal(true);
              }}
            >
              <Percent className="size-4" />
              Mudar Chance de Drop desta Zona (%)
            </button>

            {/* Aviso de Perigo / Gás NBC */}
            {currentSelectedZone.hazards && (
              <div
                className={`p-2.5 rounded-sm border text-xs flex gap-2 ${
                  currentSelectedZone.tier.includes("Zona Tóxica")
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-destructive/40 bg-destructive/10 text-destructive-foreground"
                }`}
              >
                {currentSelectedZone.tier.includes("Zona Tóxica") ? (
                  <Skull className="size-4 shrink-0 mt-0.5 text-emerald-400 animate-pulse" />
                ) : (
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold block">Atenção & Perigo:</span>
                    <span className="text-[10px] px-1 py-0.2 rounded-xs font-bold uppercase bg-background/50">
                      {currentSelectedZone.pvpDanger}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight mt-0.5">
                    {currentSelectedZone.hazards}
                  </p>
                </div>
              </div>
            )}

            {/* Estruturas Táticas da Zona */}
            <div>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1.5">
                <Building2 className="size-3.5 text-amber-400" /> Estruturas & Bunkers na Zona:
              </span>
              <div className="flex flex-wrap gap-1">
                {currentSelectedZone.structures.map((st) => (
                  <span
                    key={st}
                    className="px-2 py-0.5 rounded-xs bg-secondary/80 border border-border/80 text-[10px] text-foreground font-medium"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabela Interativa de Chances de Spawn de Itens (%) na Zona Militar */}
            {(() => {
              const zoneItems = getZoneItems(currentSelectedZone);
              const avgChance = Math.round(
                zoneItems.reduce((acc, curr) => acc + curr.chance, 0) / (zoneItems.length || 1),
              );

              return (
                <div className="space-y-2.5 rounded-sm bg-secondary/30 p-2.5 border border-border/60">
                  {/* Cabeçalho da Seção de Chances */}
                  <div className="flex items-center justify-between gap-1 border-b border-border/40 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Percent className="size-3.5 text-primary" />
                        <span>Chances de Spawn de Itens (%)</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        {zoneItems.length} itens configurados · Média: {avgChance}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="btn-ghost text-[10px] px-1.5 py-0.5 flex items-center gap-1 hover:text-foreground text-muted-foreground"
                        onClick={() => handleResetZoneLoot(currentSelectedZone)}
                        title="Restaurar chances padrão oficiais"
                      >
                        <RotateCcw className="size-2.5" />
                        Reset
                      </button>
                      <button
                        className="btn-ghost text-[10px] px-1.5 py-0.5 flex items-center gap-1 text-primary hover:text-primary font-medium"
                        onClick={() => copyZoneLootXml(currentSelectedZone)}
                        title="Copiar XML de Spawn com as % para cfgspawnabletypes.xml"
                      >
                        <FileCode className="size-2.5" />
                        XML %
                      </button>
                      <button
                        className="btn-ghost text-[10px] px-1.5 py-0.5 flex items-center gap-1 hover:text-foreground text-muted-foreground"
                        onClick={() => copyZoneLootJson(currentSelectedZone)}
                        title="Copiar JSON da tabela de loot com %"
                      >
                        <Copy className="size-2.5" />
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* Lista de Itens com Slider e Campo Numérico de % */}
                  <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                    {zoneItems.map((item) => {
                      const badge = getChanceBadge(item.chance);
                      return (
                        <div
                          key={item.id}
                          className="rounded-xs bg-background/70 p-2 border border-border/50 text-xs space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex flex-col min-w-0 max-w-[170px]">
                              <span
                                className="font-semibold text-foreground truncate"
                                title={item.name}
                              >
                                {getItemLabel(item.name)}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-xs font-mono font-bold border ${badge.badge}`}
                              >
                                {item.chance}% · {badge.label}
                              </span>
                              <button
                                className="btn-ghost size-5 p-0 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                                onClick={() =>
                                  handleRemoveItemFromZone(currentSelectedZone.id, item.id)
                                }
                                title={`Remover ${item.name}`}
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>

                          {/* Barra de Progresso Visual e Controles de Ajuste da Chance */}
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={item.chance}
                              onChange={(e) =>
                                handleUpdateItemChance(
                                  currentSelectedZone.id,
                                  item.id,
                                  +e.target.value,
                                )
                              }
                              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                              title={`Ajustar chance de spawn: ${item.chance}%`}
                            />
                            <div className="relative flex items-center shrink-0">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.chance}
                                onChange={(e) =>
                                  handleUpdateItemChance(
                                    currentSelectedZone.id,
                                    item.id,
                                    +e.target.value,
                                  )
                                }
                                className="h-6 w-12 rounded-xs border border-border bg-background px-1 text-center font-mono text-[11px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span className="absolute right-1 text-[10px] text-muted-foreground pointer-events-none">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Adicionar Novo Item à Tabela da Zona */}
                  <div className="pt-1.5 border-t border-border/40 space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Adicionar item à zona:
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nome / classname DayZ..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="field text-xs flex-1 h-7"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddItemToZone(currentSelectedZone.id);
                          }
                        }}
                      />
                      <div className="relative flex items-center shrink-0 w-16">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newItemChance}
                          onChange={(e) => setNewItemChance(+e.target.value)}
                          className="field text-xs w-full h-7 text-center font-mono pr-4"
                          title="Chance inicial de spawn em %"
                        />
                        <span className="absolute right-1.5 text-[10px] text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                      <button
                        className="btn-primary text-xs px-2.5 h-7 flex items-center gap-1 shrink-0 font-medium shadow-xs"
                        onClick={() => handleAddItemToZone(currentSelectedZone.id)}
                        title="Adicionar item com a chance especificada"
                      >
                        <Plus className="size-3" />
                        Adicionar
                      </button>
                    </div>

                    {/* Sugestões Rápidas de Armas e Itens Militares DayZ */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-muted-foreground mr-0.5 font-medium">
                        Sugestões rápidas:
                      </span>
                      {[
                        { name: "M4A1", chance: 15 },
                        { name: "LAR (FAL)", chance: 8 },
                        { name: "DMR", chance: 18 },
                        { name: "VSD", chance: 12 },
                        { name: "Colete Balístico", chance: 30 },
                        { name: "NVG", chance: 15 },
                        { name: "Traje NBC", chance: 25 },
                        { name: "Munição 5.56", chance: 60 },
                      ].map((sug) => (
                        <button
                          key={sug.name}
                          className="px-1.5 py-0.5 rounded-xs bg-secondary/80 hover:bg-secondary text-[10px] text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
                          onClick={() =>
                            handleAddItemToZone(currentSelectedZone.id, sug.name, sug.chance)
                          }
                          title={`Adicionar ${sug.name} com ${sug.chance}%`}
                        >
                          + {sug.name} ({sug.chance}%)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Indicadores de Spawns de Eventos */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-secondary/30 p-2 rounded-sm border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Heli Crashes:</span>
                <span className="font-semibold text-foreground">
                  {currentSelectedZone.heliCrashChance ?? "Baixa"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Convois Militares:</span>
                <span className="font-semibold text-foreground">
                  {currentSelectedZone.convoyChance ?? "Média"}
                </span>
              </div>
            </div>

            {/* Painel de Coordenadas e Posição da Zona Militar */}
            <div className="rounded-sm bg-secondary/40 p-3 border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MapPin className="size-4 text-primary" />
                  <span>Posição da Zona (Coordenadas X / Z)</span>
                </div>
                {(() => {
                  const defaultZ = MILITARY_ZONES.find((d) => d.id === currentSelectedZone.id);
                  const isMoved =
                    defaultZ &&
                    (defaultZ.x !== currentSelectedZone.x || defaultZ.z !== currentSelectedZone.z);
                  if (!isMoved) return null;
                  return (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      Posição Alterada
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground font-mono block mb-1">
                    Coordenada X (0 - 15360):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={SIZE}
                    step={50}
                    value={currentSelectedZone.x}
                    onChange={(e) =>
                      handleUpdateMilitaryZoneCoords(
                        currentSelectedZone.id,
                        Number(e.target.value),
                        currentSelectedZone.z,
                      )
                    }
                    className="field w-full font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-mono block mb-1">
                    Coordenada Z (0 - 15360):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={SIZE}
                    step={50}
                    value={currentSelectedZone.z}
                    onChange={(e) =>
                      handleUpdateMilitaryZoneCoords(
                        currentSelectedZone.id,
                        currentSelectedZone.x,
                        Number(e.target.value),
                      )
                    }
                    className="field w-full font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  className={`btn text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 flex-1 font-bold ${
                    repositioningZone?.id === currentSelectedZone.id
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "btn-primary"
                  }`}
                  onClick={() =>
                    setRepositioningZone((cur) =>
                      cur?.id === currentSelectedZone.id
                        ? null
                        : { type: "military", id: currentSelectedZone.id },
                    )
                  }
                  title="Ativar modo de clique no mapa para mover"
                >
                  <LocateFixed className="size-3.5" />
                  {repositioningZone?.id === currentSelectedZone.id
                    ? "Clique no Mapa..."
                    : "Mover no Mapa (Clique)"}
                </button>

                {(() => {
                  const defaultZ = MILITARY_ZONES.find((d) => d.id === currentSelectedZone.id);
                  const isMoved =
                    defaultZ &&
                    (defaultZ.x !== currentSelectedZone.x || defaultZ.z !== currentSelectedZone.z);
                  if (!isMoved) return null;
                  return (
                    <button
                      className="btn-ghost text-xs py-1.5 px-2.5 flex items-center gap-1 border border-border/60 hover:text-foreground text-muted-foreground"
                      onClick={() => handleResetMilitaryZoneCoords(currentSelectedZone.id)}
                      title={`Restaurar coordenadas originais: X:${defaultZ.x} Z:${defaultZ.z}`}
                    >
                      <RotateCcw className="size-3" />
                      Restaurar Posição
                    </button>
                  );
                })()}

                <button
                  className="btn-danger text-xs py-1.5 px-2.5 flex items-center gap-1"
                  onClick={() => handleDeleteMilitaryZone(currentSelectedZone.id)}
                  title="Remover ou ocultar esta zona militar do mapa"
                >
                  <Trash2 className="size-3" />
                  Tirar Zona
                </button>
              </div>

              {/* Botões de Cópia XML DayZ e Focar */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border/40">
                <button
                  className="btn-ghost text-xs py-1.5 flex items-center justify-center gap-1 hover:text-primary"
                  onClick={() => copyZoneEventXml(currentSelectedZone)}
                  title="Copiar tag <zone> para cfgeventspawns.xml"
                >
                  <FileCode className="size-3 text-primary" />
                  XML Zona
                </button>
                <button
                  className="btn-ghost text-xs py-1.5 flex items-center justify-center gap-1 hover:text-primary"
                  onClick={() => copyZoneLootXml(currentSelectedZone)}
                  title="Copiar XML com % de chance dos itens para cfgspawnabletypes.xml"
                >
                  <Percent className="size-3 text-emerald-400" />
                  Spawns %
                </button>
                <button
                  className="btn-ghost text-xs py-1.5 flex items-center justify-center gap-1 hover:text-primary"
                  onClick={() => copySafezoneXml(currentSelectedZone)}
                  title="Copiar tag de território/safezone com raio"
                >
                  <Shield className="size-3 text-amber-400" />
                  Território
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  className="btn-ghost text-xs py-1.5 flex items-center justify-center gap-1"
                  onClick={() =>
                    copyCoords(
                      currentSelectedZone.x,
                      currentSelectedZone.z,
                      currentSelectedZone.name,
                    )
                  }
                >
                  <Copy className="size-3 text-primary" />
                  Copiar X 0 Z
                </button>
                <button
                  className="btn-ghost text-xs py-1.5 flex items-center justify-center gap-1.5 border border-border/60 hover:bg-secondary"
                  onClick={() => convertZoneToMarker(currentSelectedZone)}
                >
                  <Plus className="size-3.5 text-primary" />
                  Criar Marcador
                </button>
              </div>

              <button
                className="btn-primary w-full text-xs py-1.5 flex items-center justify-center gap-1.5 shadow-xs mt-1"
                onClick={() => focusOnLocation(currentSelectedZone.x, currentSelectedZone.z, 3)}
              >
                <LocateFixed className="size-3.5" />
                Focar Zona no Mapa
              </button>
            </div>
          </div>
        ) : currentSelectedPvpZone ? (
          /* Card de Detalhes: Zona de PvP Selecionada */
          <div className="panel space-y-3 p-3.5 border-red-500/50 bg-card shadow-md animate-in fade-in-50">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-xs border ${
                      currentSelectedPvpZone.type === "pvp_allowed"
                        ? "bg-red-950 text-red-300 border-red-700"
                        : "bg-emerald-950 text-emerald-300 border-emerald-700"
                    }`}
                  >
                    {currentSelectedPvpZone.type === "pvp_allowed"
                      ? "⚔️ PVP LIBERADO"
                      : "🛡️ SAFEZONE PVE"}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Raio: {currentSelectedPvpZone.radius}m
                  </span>
                </div>
                <h3 className="font-display text-base text-foreground mt-1 font-semibold flex items-center gap-1.5">
                  <Crosshair className="size-4 text-red-400 shrink-0" />
                  {currentSelectedPvpZone.name}
                </h3>
              </div>
              <button
                className="btn-ghost size-7 p-0 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setSelectedPvpZoneId(null)}
                title="Fechar inspeção"
              >
                ✕
              </button>
            </div>

            {/* Edição de Nome e Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                  Nome da Zona:
                </label>
                <input
                  type="text"
                  value={currentSelectedPvpZone.name}
                  onChange={(e) =>
                    handleUpdatePvpZoneField(currentSelectedPvpZone.id, { name: e.target.value })
                  }
                  className="field w-full text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                  Tipo de Zona:
                </label>
                <select
                  value={currentSelectedPvpZone.type}
                  onChange={(e) =>
                    handleUpdatePvpZoneField(currentSelectedPvpZone.id, {
                      type: e.target.value as any,
                    })
                  }
                  className="field w-full text-xs font-medium"
                >
                  <option value="pvp_allowed">⚔️ PvP Liberado</option>
                  <option value="safezone">🛡️ Safezone PvE Protegida</option>
                </select>
              </div>
            </div>

            {/* Mudança de Posição / Coordenadas X e Z */}
            <div className="rounded-sm bg-secondary/40 p-2.5 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-red-400" />
                  Posição da Zona (X / Z):
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  X: {currentSelectedPvpZone.x} · Z: {currentSelectedPvpZone.z}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono block">
                    X (0 - 15360):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={SIZE}
                    step={50}
                    value={currentSelectedPvpZone.x}
                    onChange={(e) =>
                      handleUpdatePvpZoneCoords(
                        currentSelectedPvpZone.id,
                        Number(e.target.value),
                        currentSelectedPvpZone.z,
                      )
                    }
                    className="field w-full font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono block">
                    Z (0 - 15360):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={SIZE}
                    step={50}
                    value={currentSelectedPvpZone.z}
                    onChange={(e) =>
                      handleUpdatePvpZoneCoords(
                        currentSelectedPvpZone.id,
                        currentSelectedPvpZone.x,
                        Number(e.target.value),
                      )
                    }
                    className="field w-full font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-1.5 pt-1">
                <button
                  className={`btn text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1.5 font-bold ${
                    repositioningZone?.id === currentSelectedPvpZone.id
                      ? "bg-red-600 text-white animate-pulse"
                      : "btn-primary"
                  }`}
                  onClick={() =>
                    setRepositioningZone((cur) =>
                      cur?.id === currentSelectedPvpZone.id
                        ? null
                        : { type: "pvp", id: currentSelectedPvpZone.id },
                    )
                  }
                >
                  <LocateFixed className="size-3.5" />
                  {repositioningZone?.id === currentSelectedPvpZone.id
                    ? "Clique no Mapa..."
                    : "Mover no Mapa (Clique)"}
                </button>
                <button
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 border border-border/60 hover:text-foreground text-muted-foreground"
                  onClick={() => focusOnLocation(currentSelectedPvpZone.x, currentSelectedPvpZone.z, 2.5)}
                  title="Focar no mapa"
                >
                  <LocateFixed className="size-3.5 text-primary" />
                  Focar
                </button>
                <button
                  className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
                  onClick={() => handleDeletePvpZone(currentSelectedPvpZone.id)}
                  title="Excluir esta Zona de PvP"
                >
                  <Trash2 className="size-3.5" />
                  Excluir
                </button>
              </div>
            </div>

            {/* Controle de Raio */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Raio de Cobertura:</span>
                <span className="font-mono font-bold text-red-400">
                  {currentSelectedPvpZone.radius} metros
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={3000}
                step={25}
                value={currentSelectedPvpZone.radius}
                onChange={(e) =>
                  handleUpdatePvpZoneRadius(currentSelectedPvpZone.id, Number(e.target.value))
                }
                className="h-2 w-full cursor-pointer accent-red-500 bg-secondary rounded-lg"
              />
            </div>

            {/* Notificações de Entrada / Saída */}
            <div className="space-y-1.5 text-xs">
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                  Mensagem ao Entrar:
                </label>
                <input
                  type="text"
                  value={currentSelectedPvpZone.enterNotification}
                  onChange={(e) =>
                    handleUpdatePvpZoneField(currentSelectedPvpZone.id, {
                      enterNotification: e.target.value,
                    })
                  }
                  className="field w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                  Mensagem ao Sair:
                </label>
                <input
                  type="text"
                  value={currentSelectedPvpZone.exitNotification}
                  onChange={(e) =>
                    handleUpdatePvpZoneField(currentSelectedPvpZone.id, {
                      exitNotification: e.target.value,
                    })
                  }
                  className="field w-full text-xs"
                />
              </div>
            </div>
          </div>
        ) : cur ? (
          /* Card de Detalhes: Marcador Personalizado Selecionado */
          <div className="panel space-y-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-primary font-semibold">Editar Marcador</h3>
              <button
                className="btn-ghost size-6 p-0 text-muted-foreground text-xs"
                onClick={() => setSel(null)}
              >
                ✕
              </button>
            </div>

            <input
              className="field w-full text-sm"
              value={cur.name}
              placeholder="Nome do marcador"
              onChange={(e) => upd({ name: e.target.value })}
            />

            <select
              className="field w-full text-xs"
              value={cur.kind}
              onChange={(e) => upd({ kind: e.target.value as Kind })}
            >
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <label className="flex-1 text-xs text-muted-foreground">
                X
                <input
                  className="field w-full mt-0.5 font-mono text-xs"
                  type="number"
                  value={cur.x}
                  onChange={(e) => upd({ x: +e.target.value })}
                />
              </label>
              <label className="flex-1 text-xs text-muted-foreground">
                Z
                <input
                  className="field w-full mt-0.5 font-mono text-xs"
                  type="number"
                  value={cur.z}
                  onChange={(e) => upd({ z: +e.target.value })}
                />
              </label>
            </div>

            <input
              className="field w-full text-xs"
              placeholder="Dono / clã responsável"
              value={cur.owner}
              onChange={(e) => upd({ owner: e.target.value })}
            />
            <input
              className="field w-full text-xs"
              placeholder="Membros (separe por vírgula)"
              value={cur.members}
              onChange={(e) => upd({ members: e.target.value })}
            />
            <textarea
              className="w-full rounded-sm border border-input bg-background p-2 text-xs"
              rows={3}
              placeholder="Anotações (portões, regras de invasão, armazém, etc.)"
              value={cur.notes}
              onChange={(e) => upd({ notes: e.target.value })}
            />

            <p className="text-[11px] text-muted-foreground">Registrado em {cur.created}</p>

            <div className="flex gap-2 pt-1">
              <button
                className="btn-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1 shadow-xs"
                onClick={() => focusOnLocation(cur.x, cur.z, 3)}
              >
                <LocateFixed className="size-3" /> Focar
              </button>
              <button
                className="btn-ghost flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                onClick={() => copyCoords(cur.x, cur.z, cur.name)}
              >
                <Copy className="size-3" /> Copiar Posição
              </button>
              <button
                className="btn-danger text-xs py-1.5 px-3"
                onClick={() => {
                  save(markers.filter((m) => m.id !== sel));
                  setSel(null);
                  toast.success("Marcador excluído");
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        ) : null}

        {/* Painel de Navegação: Zonas Militares do Mapa vs Meus Marcadores */}
        <div className="panel space-y-3 p-3">
          <div className="flex rounded-sm bg-secondary/50 p-1 border border-border/60 gap-1">
            <button
              className={`flex-1 py-1 text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-1 ${
                activeTab === "military"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("military")}
            >
              <ShieldAlert className="size-3.5" />
              <span>Militares ({visibleMilitaryZones.length})</span>
            </button>
            <button
              className={`flex-1 py-1 text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-1 ${
                activeTab === "pvp"
                  ? "bg-red-600 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("pvp")}
            >
              <Swords className="size-3.5 text-red-300" />
              <span>Zonas PvP ({pvpZones.length})</span>
            </button>
            <button
              className={`flex-1 py-1 text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-1 ${
                activeTab === "custom"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("custom")}
            >
              <MapPin className="size-3.5" />
              <span>Marcadores ({markers.length})</span>
            </button>
          </div>

          {/* Campo de Busca Unificado */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <input
              className="field w-full pl-8 text-xs"
              placeholder={
                activeTab === "military"
                  ? "Buscar zona, cidade, estrutura ou loot (M4A1, Bunkers, Gás)..."
                  : activeTab === "pvp"
                    ? "Buscar zonas de PvP por nome ou coordenadas..."
                    : "Buscar por nome, clã ou notas..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Conteúdo da Tab: Zonas Militares */}
          {activeTab === "military" ? (
            <div className="space-y-2.5">
              {/* Botões de Ações de Zonas Militares: Nova Zona e Restaurar */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    className={`py-1.5 px-2.5 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                      addingMilitaryZone
                        ? "bg-amber-600 text-white ring-2 ring-amber-400 animate-pulse"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                    onClick={() => {
                      setAddingMilitaryZone((a) => !a);
                      setAddingPvpZone(false);
                    }}
                    title="Criar nova zona militar clicando no mapa de Chernarus"
                  >
                    <Plus className="size-3.5" />
                    {addingMilitaryZone ? "Clique no Mapa..." : "+ Nova Zona (Clique)"}
                  </button>
                  <button
                    className="btn-ghost py-1.5 px-2 text-xs font-semibold border border-border/70 hover:bg-secondary flex items-center justify-center gap-1"
                    onClick={() => {
                      setNewZoneForm({
                        name: "Nova Zona Militar",
                        shortName: "Nova Base",
                        x: 7500,
                        z: 7500,
                        radius: 500,
                        tier: "Tier 3",
                        zoneType: "Complexo Militar Principal",
                        pvpType: "pvp_allowed",
                        description:
                          "Zona militar customizada com spawns de armas e itens de alto nível.",
                      });
                      setShowAddZoneModal("military");
                    }}
                    title="Digitar coordenadas X e Z exatas para criar zona militar"
                  >
                    <MapPin className="size-3 text-primary" />
                    + Manual (X, Z)
                  </button>
                </div>

                {/* Botão de Restaurar Zonas Originais se houver modificações */}
                {(() => {
                  const isModified =
                    militaryZones.length !== MILITARY_ZONES.length ||
                    militaryZones.some((z) => {
                      const orig = MILITARY_ZONES.find((o) => o.id === z.id);
                      return !orig || orig.x !== z.x || orig.z !== z.z || orig.radius !== z.radius;
                    });
                  if (!isModified) return null;
                  return (
                    <button
                      className="btn-ghost w-full py-1 px-2.5 text-[11px] font-medium border border-border/60 hover:text-foreground text-muted-foreground flex items-center justify-center gap-1.5"
                      onClick={handleResetAllMilitaryZones}
                      title="Restaurar todas as 25 zonas militares oficiais do DayZ"
                    >
                      <RotateCcw className="size-3" />
                      Restaurar Padrão Oficial (25 Zonas)
                    </button>
                  );
                })()}
              </div>

              {/* Banner / Botão de Ação Rápida para Configurar Chance de Drop */}
              <div className="p-2 rounded-sm bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs">
                  <Percent className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300 block text-xs">
                      Chances de Drop das Zonas
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Ajuste a % de drop de cada arma e item
                    </span>
                  </div>
                </div>
                <button
                  className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1 font-bold shadow-xs shrink-0 cursor-pointer"
                  onClick={() => {
                    const targetId = selectedMilitaryZone?.id ?? "tisy";
                    setModalSelectedZoneId(targetId);
                    setShowDropChanceModal(true);
                  }}
                  title="Abrir painel para alterar a % de chance de drop"
                >
                  <SlidersHorizontal className="size-3" />
                  Mudar Drop (%)
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>Clique para focar e ver raio/loot:</span>
                <span>{visibleMilitaryZones.length} zonas</span>
              </div>
              <ul className="max-h-[360px] space-y-1.5 overflow-auto pr-1">
                {visibleMilitaryZones.map((z) => {
                  const isSelected = selectedMilitaryZone?.id === z.id;
                  const isToxic = z.tier.includes("Zona Tóxica");

                  return (
                    <li key={z.id}>
                      <button
                        className={`group w-full rounded-sm p-2 text-left text-xs transition-all border ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/60 shadow-xs"
                            : "bg-secondary/40 hover:bg-secondary border-border/40"
                        }`}
                        onClick={() => {
                          setSelectedMilitaryZone(z);
                          setSel(null);
                          focusOnLocation(z.x, z.z, 2.5);
                        }}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {isToxic ? (
                              <Skull className="size-3.5 text-emerald-400 shrink-0" />
                            ) : z.tier === "Tier 4" ? (
                              <ShieldAlert className="size-3.5 text-red-400 shrink-0" />
                            ) : (
                              <Crosshair className="size-3.5 text-amber-400 shrink-0" />
                            )}
                            {z.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono text-muted-foreground bg-background/60 px-1 py-0.2 rounded-xs border border-border/50">
                              {z.radius}m
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-xs font-mono font-bold ${
                                isToxic
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : z.tier === "Tier 4"
                                    ? "bg-red-950 text-red-300 border border-red-800"
                                    : z.tier === "Tier 3"
                                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                                      : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {z.tier}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1">
                          {z.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] pt-1 mt-1 border-t border-border/30">
                          <span className="text-muted-foreground/80 font-mono">
                            X {z.x} · Z {z.z}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-xs bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 hover:bg-amber-500/25 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRepositioningZone({ type: "military", id: z.id });
                              }}
                              title="Reposicionar esta zona no mapa"
                            >
                              <LocateFixed className="size-2.5 text-amber-400" />
                              Mover
                            </span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMilitaryZone(z);
                                setModalSelectedZoneId(z.id);
                                setShowDropChanceModal(true);
                              }}
                              title="Abrir painel para alterar a % de chance de drop desta zona"
                            >
                              <Percent className="size-2.5 text-emerald-400" />
                              Drop
                            </span>
                            <span
                              className="text-[10px] px-1 py-0.5 rounded-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMilitaryZone(z.id);
                              }}
                              title="Tirar/Excluir zona militar"
                            >
                              <Trash2 className="size-3" />
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : activeTab === "pvp" ? (
            /* Conteúdo da Tab: Zonas de PvP & Safezones Programáveis */
            <div className="space-y-3">
              {/* Card Mestre: Modo PvP Restrito por Zonas (Fora da Zona: Sem dano em jogador) */}
              <div
                className={`p-3 rounded-sm border transition-all ${
                  pvpRestrictedMode
                    ? "bg-emerald-950/20 border-emerald-500/50 shadow-sm"
                    : "bg-secondary/40 border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {pvpRestrictedMode ? (
                      <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Swords className="size-4 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-xs text-foreground block">
                        Modo PvP Restrito por Zonas
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {pvpRestrictedMode
                          ? "🟢 ATIVADO: Fora das zonas marcadas, tiro em jogador é BLOQUEADO!"
                          : "⚪ DESATIVADO: Tiro em jogadores liberado em todo o mapa (Vanilla)."}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`btn text-[11px] py-1 px-2.5 font-bold transition-all shrink-0 ${
                      pvpRestrictedMode
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "btn-ghost border border-border"
                    }`}
                    onClick={() => handleToggleRestrictedPvp(!pvpRestrictedMode)}
                  >
                    {pvpRestrictedMode ? "Ativado" : "Desativado"}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed border-t border-border/40 pt-1.5">
                  Quando ativado, os jogadores só conseguem causar dano e atirar em outros jogadores
                  se ambos estiverem DENTRO dos círculos de PvP programados abaixo.
                </p>
              </div>

              {/* Card Rápido: Controle de Raid de Bases */}
              <div
                className={`p-3 rounded-sm border transition-all ${
                  raidConfig.raidEnabled
                    ? "bg-amber-950/20 border-amber-500/50 shadow-sm"
                    : "bg-emerald-950/20 border-emerald-500/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {raidConfig.raidEnabled ? (
                      <Bomb className="size-4 text-amber-400 shrink-0" />
                    ) : (
                      <Shield className="size-4 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-xs text-foreground block">
                        Raid de Bases (Danos em Construções)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {raidConfig.raidEnabled
                          ? "💥 RAID ATIVADO: Paredes e portões podem ser invadidos e destruídos."
                          : "🛡️ BASES PROTEGIDAS: Construções 100% invulneráveis a tiros e explosivos."}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`btn text-[11px] py-1 px-2.5 font-bold transition-all shrink-0 ${
                      raidConfig.raidEnabled
                        ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                    onClick={() => handleToggleRaidQuick(!raidConfig.raidEnabled)}
                  >
                    {raidConfig.raidEnabled ? "Raid Ativo" : "Bases Salvas"}
                  </button>
                </div>
              </div>

              {/* Ações de Adicionar Nova Zona de PvP */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    className={`py-1.5 px-2.5 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                      addingPvpZone
                        ? "bg-red-600 text-white ring-2 ring-red-400 animate-pulse"
                        : "bg-red-600 text-white hover:bg-red-500"
                    }`}
                    onClick={() => {
                      setAddingPvpZone((a) => !a);
                      setAddingMilitaryZone(false);
                    }}
                    title="Criar nova zona de PvP clicando no mapa"
                  >
                    <Plus className="size-3.5" />
                    {addingPvpZone ? "Clique no Mapa..." : "+ Zona PvP (Clique)"}
                  </button>
                  <button
                    className="btn-ghost py-1.5 px-2 text-xs font-semibold border border-border/70 hover:bg-secondary flex items-center justify-center gap-1"
                    onClick={() => {
                      setNewZoneForm({
                        name: `Zona de PvP ${pvpZones.length + 1}`,
                        shortName: `PVP ${pvpZones.length + 1}`,
                        x: 7500,
                        z: 7500,
                        radius: 750,
                        tier: "Tier 3",
                        zoneType: "Complexo Militar Principal",
                        pvpType: "pvp_allowed",
                        description: "Área designada para combate livre entre sobreviventes.",
                      });
                      setShowAddZoneModal("pvp");
                    }}
                    title="Digitar coordenadas X e Z exatas para criar zona de PvP ou Safezone"
                  >
                    <MapPin className="size-3 text-red-400" />
                    + Manual (X, Z)
                  </button>
                </div>

                {/* Predefinições Rápidas de Zonas de Chernarus com 1 Clique */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Adicionar Zonas Táticas Famosas (1 Clique):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {DEFAULT_PVP_ZONES.map((preset) => {
                      const isAdded = pvpZones.some((z) => z.shortName === preset.shortName);
                      return (
                        <button
                          key={preset.id}
                          className={`px-2 py-0.5 rounded-xs text-[11px] border transition-all ${
                            isAdded
                              ? "bg-red-500/15 border-red-500/40 text-red-300 font-semibold"
                              : "btn-ghost border-border hover:bg-secondary text-muted-foreground"
                          }`}
                          onClick={() => handleAddPresetPvpZone(preset)}
                          title={`${preset.name} · Raio: ${preset.radius}m`}
                        >
                          {isAdded ? "✓ " : "+ "}
                          {preset.shortName} ({preset.radius}m)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lista das Zonas de PvP Programadas */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Zonas Programadas ({pvpZones.length}):
                  </span>
                  <button
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                    onClick={() => setShowInitScriptModal(true)}
                  >
                    <FileCode className="size-3" />
                    Gerar Script init.c
                  </button>
                </div>

                {pvpZones.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Nenhuma zona de PvP cadastrada. Use o botão acima ou as predefinições para
                    programar suas áreas de combate!
                  </div>
                ) : (
                  <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                    {pvpZones
                      .filter((z) =>
                        (z.name + z.shortName + z.description)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((zone) => {
                        const isSelected = selectedPvpZoneId === zone.id;
                        return (
                          <div
                            key={zone.id}
                            className={`p-2.5 rounded-sm border text-xs space-y-2 transition-all ${
                              isSelected
                                ? "bg-card border-red-500 shadow-md ring-1 ring-red-500/50"
                                : "bg-card/70 border-border/60 hover:border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`size-2.5 rounded-full shrink-0 ${
                                    zone.enabled
                                      ? "bg-red-500 animate-pulse"
                                      : "bg-muted-foreground"
                                  }`}
                                />
                                <span
                                  className="font-bold text-foreground truncate cursor-pointer hover:text-primary"
                                  onClick={() => {
                                    setSelectedPvpZoneId(zone.id);
                                    focusOnLocation(zone.x, zone.z, 2.5);
                                  }}
                                  title="Clique para focar no mapa"
                                >
                                  {zone.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold border ${
                                    zone.enabled
                                      ? "bg-red-500/20 text-red-300 border-red-500/60"
                                      : "bg-muted text-muted-foreground border-border"
                                  }`}
                                  onClick={() => handleTogglePvpZone(zone.id)}
                                  title="Ativar ou desativar esta zona"
                                >
                                  {zone.enabled ? "Ativa" : "Pausada"}
                                </button>
                                <button
                                  className={`btn-ghost size-6 p-0 ${
                                    repositioningZone?.id === zone.id
                                      ? "text-red-400 animate-pulse bg-red-500/20"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  onClick={() =>
                                    setRepositioningZone((cur) =>
                                      cur?.id === zone.id ? null : { type: "pvp", id: zone.id },
                                    )
                                  }
                                  title="Mover esta zona no mapa"
                                >
                                  <Move className="size-3.5 text-primary" />
                                </button>
                                <button
                                  className="btn-ghost size-6 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => focusOnLocation(zone.x, zone.z, 2.5)}
                                  title="Centralizar no mapa"
                                >
                                  <LocateFixed className="size-3.5 text-primary" />
                                </button>
                                <button
                                  className="btn-ghost size-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeletePvpZone(zone.id)}
                                  title="Excluir Zona"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-mono">
                                Coords: X: {zone.x} · Z: {zone.z}
                              </span>
                              <span className="font-mono font-bold text-red-400">
                                Raio: {zone.radius} metros
                              </span>
                            </div>

                            {/* Slider de Raio em Metros */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>Ajustar Raio de PvP:</span>
                                <span>{zone.radius}m</span>
                              </div>
                              <input
                                type="range"
                                min="100"
                                max="3000"
                                step="25"
                                value={zone.radius}
                                onChange={(e) =>
                                  handleUpdatePvpZoneRadius(zone.id, Number(e.target.value))
                                }
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-red-500"
                              />
                            </div>

                            {/* Notificação ao entrar */}
                            <div className="text-[10px] text-muted-foreground bg-secondary/30 p-1.5 rounded-xs">
                              <span className="font-semibold text-foreground block">
                                Mensagem de Entrada:
                              </span>
                              <span className="italic">{zone.enterNotification}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Botão para Abrir o Código do Servidor */}
              <div className="p-2.5 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-primary block">Aplicar no Servidor DayZ</span>
                  <span className="text-[10px] text-muted-foreground">
                    Gere o script pronto para colar em init.c
                  </span>
                </div>
                <button
                  className="btn-primary text-xs py-1 px-3 shadow-xs shrink-0 flex items-center gap-1 font-bold"
                  onClick={() => setShowInitScriptModal(true)}
                >
                  <FileCode className="size-3.5" />
                  Ver Código
                </button>
              </div>
            </div>
          ) : (
            /* Conteúdo da Tab: Marcadores Salvos */
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {KINDS.map((k) => (
                  <button
                    key={k}
                    className={`rounded-sm border px-2 py-0.5 text-[11px] transition-colors ${
                      filter.has(k) ? "border-primary text-foreground" : "border-border opacity-50"
                    }`}
                    onClick={() => {
                      const f = new Set(filter);
                      if (f.has(k)) {
                        f.delete(k);
                      } else {
                        f.add(k);
                      }
                      setFilter(f);
                    }}
                  >
                    {k} ({markers.filter((m) => m.kind === k).length})
                  </button>
                ))}
              </div>

              {visibleMarkers.length === 0 ? (
                <div className="rounded-sm border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                  Nenhum marcador registrado. Selecione um tipo no topo do mapa e clique para marcar
                  bases ou traders.
                </div>
              ) : (
                <ul className="max-h-[300px] space-y-1 overflow-auto pr-1">
                  {visibleMarkers.map((m) => (
                    <li key={m.id}>
                      <button
                        className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-secondary ${
                          sel === m.id ? "bg-secondary border-l-2 border-primary" : ""
                        }`}
                        onClick={() => {
                          setSel(m.id);
                          setSelectedMilitaryZone(null);
                          focusOnLocation(m.x, m.z, 2.5);
                        }}
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: COLORS[m.kind] }}
                        />
                        <div className="truncate flex-1">
                          <span className="font-medium text-foreground block truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            X: {m.x} · Z: {m.z}
                          </span>
                        </div>
                        {m.owner && (
                          <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-[80px]">
                            {m.owner}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 pt-1 border-t border-border/60">
                <button className="btn-ghost flex-1 text-xs py-1" onClick={exportJson}>
                  Exportar JSON
                </button>
                <button className="btn-ghost flex-1 text-xs py-1" onClick={importJson}>
                  Importar JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Modal / Dialog de Configuração de Chance de Drop de Zonas Militares */}
      {showDropChanceModal &&
        (() => {
          const currentModalZone =
            effectiveMilitaryZones.find((z) => z.id === modalSelectedZoneId) ??
            currentSelectedZone ??
            effectiveMilitaryZones[0];
          const modalZoneItems = getZoneItems(currentModalZone);
          const modalAvgChance = Math.round(
            modalZoneItems.reduce((acc, curr) => acc + curr.chance, 0) /
              (modalZoneItems.length || 1),
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3">
              <div className="panel w-full max-w-2xl max-h-[90vh] flex flex-col p-4 border-emerald-500/50 shadow-2xl bg-card space-y-3.5 overflow-hidden animate-in fade-in-50 zoom-in-95">
                {/* Cabeçalho do Modal */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Percent className="size-4" />
                      </span>
                      <h2 className="font-display text-lg font-bold text-foreground">
                        Configurar Chance de Drop e Área da Zona
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Defina a porcentagem de chance de drop de cada item e diminua ou aumente o
                      raio de cobertura da zona militar em Chernarus.
                    </p>
                  </div>
                  <button
                    className="btn-ghost size-7 p-0 text-muted-foreground hover:text-foreground text-sm font-bold"
                    onClick={() => setShowDropChanceModal(false)}
                    title="Fechar"
                  >
                    ✕
                  </button>
                </div>

                {/* Seletor da Zona Militar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary/40 p-2.5 rounded-sm border border-border/50">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Zona Militar:
                    </span>
                    <select
                      className="field text-xs flex-1 font-semibold"
                      value={currentModalZone.id}
                      onChange={(e) => {
                        setModalSelectedZoneId(e.target.value);
                        const targetZ = effectiveMilitaryZones.find((z) => z.id === e.target.value);
                        if (targetZ) setSelectedMilitaryZone(targetZ);
                      }}
                    >
                      {effectiveMilitaryZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.tier}) · Raio: {z.radius}m
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-xs border ${getTierColor(currentModalZone.tier)}`}
                    >
                      {currentModalZone.tier}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded-xs border border-border/60">
                      {modalZoneItems.length} itens · Média: {modalAvgChance}%
                    </span>
                  </div>
                </div>

                {/* Ajuste Rápido de Área e Raio da Zona Selecionada no Modal */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-500/10 p-2.5 rounded-sm border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <Ruler className="size-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">
                          Área / Raio: {currentModalZone.radius}m
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          (~{(Math.PI * Math.pow(currentModalZone.radius / 1000, 2)).toFixed(2)}{" "}
                          km²)
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Diminuir ou aumentar a área de spawn e território desta zona
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="btn-ghost h-7 px-2 text-xs font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(currentModalZone.id, currentModalZone.radius - 100)
                      }
                      title="Diminuir área em 100m"
                    >
                      − 100m
                    </button>
                    <button
                      className="btn-ghost h-7 px-2 text-xs font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(currentModalZone.id, currentModalZone.radius - 50)
                      }
                      title="Diminuir área em 50m"
                    >
                      − 50m
                    </button>
                    <button
                      className="btn-ghost h-7 px-2 text-xs font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(currentModalZone.id, currentModalZone.radius + 50)
                      }
                      title="Aumentar área em 50m"
                    >
                      + 50m
                    </button>
                    <button
                      className="btn-ghost h-7 px-2 text-xs font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                      onClick={() =>
                        handleUpdateZoneRadius(currentModalZone.id, currentModalZone.radius + 100)
                      }
                      title="Aumentar área em 100m"
                    >
                      + 100m
                    </button>
                    <button
                      className="btn-ghost h-7 px-2 text-xs font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15 hidden sm:inline-flex"
                      onClick={() =>
                        handleUpdateZoneRadius(currentModalZone.id, currentModalZone.radius + 250)
                      }
                      title="Aumentar área em 250m"
                    >
                      + 250m
                    </button>

                    {/* Reset de Raio no Modal */}
                    {(() => {
                      const defaultZ = MILITARY_ZONES.find((d) => d.id === currentModalZone.id);
                      const orig = defaultZ ? defaultZ.radius : currentModalZone.radius;
                      if (currentModalZone.radius === orig) return null;
                      return (
                        <button
                          className="btn-ghost size-7 p-0 text-muted-foreground hover:text-foreground text-xs ml-0.5"
                          onClick={() => handleResetZoneRadius(currentModalZone.id)}
                          title={`Restaurar raio padrão (${orig}m)`}
                        >
                          <RotateCcw className="size-3" />
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Ações Rápidas de Multiplicador Global de Drop */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Ajuste Rápido de Drop em Lote (Todos os itens da zona):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      className="btn-ghost text-xs px-2.5 py-1 border border-border/60 hover:bg-secondary flex items-center gap-1"
                      onClick={() => handleBatchAdjustChances(currentModalZone.id, "add10")}
                      title="Aumentar +10% na chance de todos os itens desta zona"
                    >
                      +10% em Tudo
                    </button>
                    <button
                      className="btn-ghost text-xs px-2.5 py-1 border border-border/60 hover:bg-secondary flex items-center gap-1"
                      onClick={() => handleBatchAdjustChances(currentModalZone.id, "sub10")}
                      title="Diminuir -10% na chance de todos os itens desta zona"
                    >
                      -10% em Tudo
                    </button>
                    <button
                      className="btn-ghost text-xs px-2.5 py-1 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1 font-semibold"
                      onClick={() => handleBatchAdjustChances(currentModalZone.id, "double")}
                      title="Dobrar (2x) a taxa de drop dos itens"
                    >
                      2x Dobrar Drop
                    </button>
                    <button
                      className="btn-ghost text-xs px-2.5 py-1 border border-border/60 hover:bg-secondary"
                      onClick={() => handleBatchAdjustChances(currentModalZone.id, "set50")}
                      title="Definir 50% para todos os itens"
                    >
                      50% Balanceado
                    </button>
                    <button
                      className="btn-ghost text-xs px-2.5 py-1 border border-border/60 hover:bg-secondary"
                      onClick={() => handleBatchAdjustChances(currentModalZone.id, "set100")}
                      title="Definir 100% de drop para todos os itens"
                    >
                      100% Garantido
                    </button>
                    <button
                      className="btn-ghost text-xs px-2 py-1 text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1"
                      onClick={() => handleResetZoneLoot(currentModalZone)}
                      title="Restaurar valores oficiais padrão"
                    >
                      <RotateCcw className="size-3" />
                      Restaurar Padrão
                    </button>
                  </div>
                </div>

                {/* Lista dos Itens e Controles de % de Chance */}
                <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1.5 border border-border/50 rounded-sm p-2 bg-background/50">
                  {modalZoneItems.map((item) => {
                    const badge = getChanceBadge(item.chance);
                    return (
                      <div
                        key={item.id}
                        className="rounded-xs bg-card p-2.5 border border-border/60 text-xs space-y-2 shadow-2xs hover:border-border transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-bold text-foreground text-sm truncate"
                              title={item.name}
                            >
                              {getItemLabel(item.name)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-xs font-mono font-bold border ${badge.badge}`}
                            >
                              {item.chance}% · {badge.label}
                            </span>
                            <button
                              className="btn-ghost size-6 p-0 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                              onClick={() => handleRemoveItemFromZone(currentModalZone.id, item.id)}
                              title={`Remover ${item.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Slider e Input de Porcentagem */}
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={item.chance}
                            onChange={(e) =>
                              handleUpdateItemChance(currentModalZone.id, item.id, +e.target.value)
                            }
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-emerald-500"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              className="btn-ghost size-6 p-0 text-xs font-mono font-bold"
                              onClick={() =>
                                handleUpdateItemChance(
                                  currentModalZone.id,
                                  item.id,
                                  item.chance - 5,
                                )
                              }
                              title="-5%"
                            >
                              -5
                            </button>
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.chance}
                                onChange={(e) =>
                                  handleUpdateItemChance(
                                    currentModalZone.id,
                                    item.id,
                                    +e.target.value,
                                  )
                                }
                                className="h-7 w-14 rounded-xs border border-border bg-background px-1 text-center font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <span className="absolute right-1 text-[11px] text-muted-foreground pointer-events-none">
                                %
                              </span>
                            </div>
                            <button
                              className="btn-ghost size-6 p-0 text-xs font-mono font-bold"
                              onClick={() =>
                                handleUpdateItemChance(
                                  currentModalZone.id,
                                  item.id,
                                  item.chance + 5,
                                )
                              }
                              title="+5%"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Adicionar Novo Item à Zona */}
                <div className="bg-secondary/30 p-2.5 rounded-sm border border-border/50 space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Adicionar novo item à tabela de drop:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do item ou classname DayZ (ex: M4A1, SVAL, Grenade)..."
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="field text-xs flex-1 h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddItemToZone(currentModalZone.id);
                      }}
                    />
                    <div className="relative flex items-center shrink-0 w-20">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newItemChance}
                        onChange={(e) => setNewItemChance(+e.target.value)}
                        className="field text-xs w-full h-8 text-center font-mono pr-5 font-bold"
                        title="Chance de drop inicial (%)"
                      />
                      <span className="absolute right-1.5 text-xs text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                    <button
                      className="btn-primary text-xs px-3 h-8 flex items-center gap-1.5 font-bold shadow-xs shrink-0 cursor-pointer"
                      onClick={() => handleAddItemToZone(currentModalZone.id)}
                    >
                      <Plus className="size-3.5" />
                      Adicionar Item
                    </button>
                  </div>
                </div>

                {/* Rodapé com Exportações e Botão de Salvar/Fechar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-border/60 hover:text-primary font-medium"
                      onClick={() => copyZoneLootXml(currentModalZone)}
                    >
                      <FileCode className="size-3.5 text-emerald-400" />
                      Copiar XML cfgspawnabletypes.xml
                    </button>
                    <button
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-border/60 hover:text-primary font-medium"
                      onClick={() => copyZoneLootJson(currentModalZone)}
                    >
                      <Copy className="size-3.5 text-primary" />
                      Copiar JSON
                    </button>
                  </div>

                  <button
                    className="btn-primary text-xs py-1.5 px-5 font-bold shadow-sm cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => {
                      setShowDropChanceModal(false);
                      toast.success(
                        `Chances de drop de "${currentModalZone.name}" salvas com sucesso!`,
                      );
                    }}
                  >
                    Salvar e Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* MODAL DE SCRIPT INIT.C (PROTEÇÃO DE PVP POR ZONAS & RAID DE BASES) */}
      {showInitScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="panel max-w-3xl w-full max-h-[90vh] flex flex-col p-5 shadow-2xl border-primary/40 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-primary/20 text-primary">
                  <FileCode className="size-5" />
                </div>
                <div>
                  <h3 className="text-xl font-display text-foreground tracking-wide">
                    Código do Servidor: init.c (PvP por Zonas & Raid)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Código pronto para aplicar a proteção de PvP por zonas e o controle de danos em
                    bases.
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost size-8 p-0 text-muted-foreground hover:text-foreground text-sm"
                onClick={() => setShowInitScriptModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Informações e Instruções Rápidas */}
            <div className="bg-primary/10 border border-primary/30 p-3 rounded-sm text-xs space-y-1.5">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span>📋</span> Como aplicar no seu servidor Nitrado / Console (Xbox/PS) / PC:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-foreground/90 text-[11px] leading-relaxed">
                <li>
                  Vá na aba <strong className="text-primary">Arquivos</strong> ou acesse o FTP do
                  seu servidor Nitrado.
                </li>
                <li>
                  Abra a pasta da sua missão (ex:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded-xs">
                    dayzOffline.chernarusplus/init.c
                  </code>
                  ).
                </li>
                <li>
                  Cole o código abaixo no final do arquivo e chame{" "}
                  <code className="bg-muted px-1 py-0.5 rounded-xs">
                    FronteiraZCombatManager.Init();
                  </code>{" "}
                  no início da função{" "}
                  <code className="bg-muted px-1 py-0.5 rounded-xs">main()</code>.
                </li>
                <li>
                  Salve o arquivo e reinicie o servidor. Fora das{" "}
                  {pvpZones.filter((z) => z.enabled).length} zonas marcadas, tiros e dano entre
                  sobreviventes estarão bloqueados!
                </li>
              </ol>
            </div>

            {/* Pré-visualização do Código Gerado */}
            <div className="flex-1 overflow-hidden flex flex-col space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold">init.c (Enforce Script)</span>
                <span className="font-mono text-[11px]">
                  {pvpZones.filter((z) => z.enabled).length} Zonas de PvP · Raid:{" "}
                  {raidConfig.raidEnabled ? "Ativado" : "Desativado"}
                </span>
              </div>
              <div className="relative flex-1 overflow-auto rounded-sm border border-border bg-[#0d151c] p-3 text-xs font-mono text-emerald-400">
                <pre className="whitespace-pre text-[11px] leading-tight">
                  {generateInitPvpScript(pvpZones, raidConfig, pvpRestrictedMode)}
                </pre>
              </div>
            </div>

            {/* Rodapé com Botões de Ação */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <button
                  className="btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  onClick={() => {
                    const code = generateInitPvpScript(pvpZones, raidConfig, pvpRestrictedMode);
                    navigator.clipboard.writeText(code);
                    toast.success("Código copiado para a área de transferência!");
                  }}
                >
                  <Copy className="size-3.5" />
                  Copiar Código init.c
                </button>
                <button
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-border/60 hover:text-primary"
                  onClick={() => {
                    const code = generateInitPvpScript(pvpZones, raidConfig, pvpRestrictedMode);
                    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "init_pvp_protection.c";
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Arquivo init_pvp_protection.c baixado!");
                  }}
                >
                  <Download className="size-3.5" />
                  Baixar Arquivo .c
                </button>
              </div>

              <button
                className="btn-ghost text-xs py-1.5 px-4"
                onClick={() => setShowInitScriptModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADIÇÃO MANUAL DE ZONA (MILITAR OU PVP) POR COORDENADAS */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="panel max-w-xl w-full flex flex-col p-5 shadow-2xl border-primary/40 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-md ${
                    showAddZoneModal === "military"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {showAddZoneModal === "military" ? (
                    <ShieldAlert className="size-5" />
                  ) : (
                    <Crosshair className="size-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-display text-foreground tracking-wide font-bold">
                    {showAddZoneModal === "military"
                      ? "Nova Zona Militar & Loot"
                      : "Nova Zona de PvP / Safezone"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Defina o nome, raio e coordenadas X e Z exatas de Chernarus.
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost size-8 p-0 text-muted-foreground hover:text-foreground text-sm"
                onClick={() => setShowAddZoneModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Formulário de Criação */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                    Nome da Zona:
                  </label>
                  <input
                    type="text"
                    value={newZoneForm.name}
                    onChange={(e) =>
                      setNewZoneForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Posto Avançado Sul"
                    className="field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                    Nome Curto / Tag:
                  </label>
                  <input
                    type="text"
                    value={newZoneForm.shortName}
                    onChange={(e) =>
                      setNewZoneForm((prev) => ({ ...prev, shortName: e.target.value }))
                    }
                    placeholder="Ex: Base Sul"
                    className="field w-full text-xs"
                  />
                </div>
              </div>

              {/* Coordenadas X e Z */}
              <div className="bg-secondary/40 p-3 rounded-sm border border-border/60 space-y-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <MapPin className="size-3.5 text-primary" />
                  Coordenadas no Mapa de Chernarus (0 a 15360):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-mono block mb-0.5">
                      Coordenada X:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={SIZE}
                      step={50}
                      value={newZoneForm.x}
                      onChange={(e) =>
                        setNewZoneForm((prev) => ({ ...prev, x: Number(e.target.value) }))
                      }
                      className="field w-full font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-mono block mb-0.5">
                      Coordenada Z:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={SIZE}
                      step={50}
                      value={newZoneForm.z}
                      onChange={(e) =>
                        setNewZoneForm((prev) => ({ ...prev, z: Number(e.target.value) }))
                      }
                      className="field w-full font-mono text-xs font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Dica: Você também pode clicar diretamente no mapa usando o botão de criação por
                  clique.
                </p>
              </div>

              {/* Raio em Metros */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Raio de Cobertura:</span>
                  <span className="font-mono font-bold text-primary">
                    {newZoneForm.radius} metros
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={4000}
                  step={25}
                  value={newZoneForm.radius}
                  onChange={(e) =>
                    setNewZoneForm((prev) => ({ ...prev, radius: Number(e.target.value) }))
                  }
                  className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                />
              </div>

              {/* Opções específicas para Militar vs PvP */}
              {showAddZoneModal === "military" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                      Tier de Loot:
                    </label>
                    <select
                      value={newZoneForm.tier}
                      onChange={(e) =>
                        setNewZoneForm((prev) => ({
                          ...prev,
                          tier: e.target.value as MilitaryTier,
                        }))
                      }
                      className="field w-full text-xs"
                    >
                      <option value="Tier 1">Tier 1 (Costa / Inicial)</option>
                      <option value="Tier 2">Tier 2 (Centro-Sul)</option>
                      <option value="Tier 3">Tier 3 (Centro-Norte)</option>
                      <option value="Tier 4">Tier 4 (Extremo Militar / Tisy)</option>
                      <option value="Zona Tóxica (Tier 4)">Zona Tóxica (Gás NBC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                      Tipo de Instalação:
                    </label>
                    <select
                      value={newZoneForm.zoneType}
                      onChange={(e) =>
                        setNewZoneForm((prev) => ({
                          ...prev,
                          zoneType: e.target.value as MilitaryZoneType,
                        }))
                      }
                      className="field w-full text-xs"
                    >
                      <option value="Complexo Militar Principal">Complexo Militar Principal</option>
                      <option value="Aeroporto Militar">Aeroporto Militar</option>
                      <option value="Posto Avançado de Bloqueio">Posto Avançado de Bloqueio</option>
                      <option value="Acampamento Militar de Tendas">
                        Acampamento Militar de Tendas
                      </option>
                      <option value="Instalação Estratégica & Radar">
                        Instalação Estratégica & Radar
                      </option>
                      <option value="Zona de Contaminação Tóxica (NBC)">
                        Zona de Contaminação Tóxica (NBC)
                      </option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                      Tipo de Regra:
                    </label>
                    <select
                      value={newZoneForm.pvpType}
                      onChange={(e) =>
                        setNewZoneForm((prev) => ({
                          ...prev,
                          pvpType: e.target.value as any,
                        }))
                      }
                      className="field w-full text-xs font-semibold"
                    >
                      <option value="pvp_allowed">⚔️ Zona de PvP Liberado (Tiro permitido)</option>
                      <option value="safezone">🛡️ Safezone PvE Protegida (Tiro bloqueado)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com Salvar e Cancelar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                className="btn-ghost text-xs py-1.5 px-4"
                onClick={() => setShowAddZoneModal(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary text-xs py-1.5 px-5 font-bold shadow-sm"
                onClick={() => {
                  const finalName =
                    newZoneForm.name.trim() ||
                    (showAddZoneModal === "military"
                      ? `Zona Militar ${militaryZones.length + 1}`
                      : `Zona de PvP ${pvpZones.length + 1}`);
                  const finalShort =
                    newZoneForm.shortName.trim() ||
                    (showAddZoneModal === "military"
                      ? `Base ${militaryZones.length + 1}`
                      : `PVP ${pvpZones.length + 1}`);

                  if (showAddZoneModal === "military") {
                    const newZ: MilitaryZone = {
                      id: `custom-mil-${Date.now()}`,
                      name: finalName,
                      shortName: finalShort,
                      x: Math.max(0, Math.min(SIZE, newZoneForm.x)),
                      z: Math.max(0, Math.min(SIZE, newZoneForm.z)),
                      radius: Math.max(50, Math.min(10000, newZoneForm.radius)),
                      tier: newZoneForm.tier,
                      zoneType: newZoneForm.zoneType,
                      pvpDanger: "Alto Risco",
                      description:
                        newZoneForm.description.trim() ||
                        `Zona militar personalizada criada em X:${newZoneForm.x} Z:${newZoneForm.z}.`,
                      structures: ["Quartéis Militares", "Guaritas de Perímetro", "Paiol de Armas"],
                      keyLoot: [
                        "Fuzis de Assalto",
                        "Coletes Táticos",
                        "Munições",
                        "Mochilas Militares",
                      ],
                    };
                    handleAddMilitaryZone(newZ);
                  } else {
                    const newP: PvpZone = {
                      id: `pvp-${Date.now()}`,
                      name: finalName,
                      shortName: finalShort,
                      type: newZoneForm.pvpType,
                      x: Math.max(0, Math.min(SIZE, newZoneForm.x)),
                      z: Math.max(0, Math.min(SIZE, newZoneForm.z)),
                      radius: Math.max(50, Math.min(5000, newZoneForm.radius)),
                      enabled: true,
                      schedule: "always",
                      enterNotification:
                        newZoneForm.pvpType === "pvp_allowed"
                          ? `⚠️ ATENÇÃO: Você entrou na Zona de PVP (${finalName})! Combate liberado!`
                          : `🛡️ SEGURO: Você entrou na Safezone PvE (${finalName})! Dano bloqueado.`,
                      exitNotification:
                        newZoneForm.pvpType === "pvp_allowed"
                          ? `🛡️ SEGURO: Você saiu da Zona de PVP! Combate DESATIVADO.`
                          : `⚠️ ATENÇÃO: Você saiu da Safezone PvE! Cuidado ao explorar.`,
                      blockBulletDamageOutside: true,
                      blockMeleeDamageOutside: true,
                      color: newZoneForm.pvpType === "pvp_allowed" ? "#ef4444" : "#10b981",
                    };
                    const updated = [...pvpZones, newP];
                    setPvpZones(updated);
                    savePvpZones(updated);
                    setSelectedPvpZoneId(newP.id);
                    setActiveTab("pvp");
                    focusOnLocation(newP.x, newP.z, 2.5);
                    toast.success(`Zona "${newP.name}" criada com sucesso!`);
                  }

                  setShowAddZoneModal(null);
                }}
              >
                Criar e Posicionar no Mapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
