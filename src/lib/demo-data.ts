// Dados de exemplo do modo demonstração (sem token da Nitrado).
export const DEMO_SERVICE_ID = 1;
export const DEMO_MISSION = "/games/demo/dayzxb/dayzxb_missions/dayzOffline.chernarusplus";

// Catálogo de itens vanilla do DayZ: [nome, nominal, categoria, usos]
export type ItemDef = [name: string, nominal: number, category: string, usages: string[]];
const W = "weapons",
  C = "clothes",
  F = "food",
  T = "tools",
  CT = "containers",
  V = "vehicleparts";
const MIL = ["Military"],
  POL = ["Police"],
  TOWN = ["Town"],
  VIL = ["Village"],
  COAST = ["Coast"],
  IND = ["Industrial"],
  HUNT = ["Hunting"],
  OFF = ["Office"],
  MED = ["Medic"],
  SCHOOL = ["School"];

import { DAYZ_ITEM_TRANSLATIONS, getItemLabel } from "./item-translations";

export { DAYZ_ITEM_TRANSLATIONS, getItemLabel };

export const ITEM_LABELS: Record<string, string> = {
  ...DAYZ_ITEM_TRANSLATIONS,
  AKS74U: "AKS-74U (Carabina compacta)",
  AURAX: "AUR A1/AX (Fuzil bullpup)",
  Aug: "AUR A1 (Bullpup militar)",
  FAL: "LAR / FAL (Fuzil de batalha)",
  M16A2: "M16A2 (Fuzil militar rajada)",
  VSS: "VSS Vintorez (Rifle silenciado)",
  ASVAL: "AS-VAL (Fuzil especial)",
  // Snipers / Caça
  SVD: "SVD Dragunov (Sniper militar)",
  Mosin9130: "Mosin 91/30 (Rifle de ferrolho)",
  SKS: "SKS (Carabina semi-automática)",
  CR527: "CR-527 (Rifle de caça)",
  Blaze: "Blaze 95 (Rifle cano duplo .308)",
  Repeater: "Repeater (Carabina de alavanca)",
  Sporter22: "Sporter 22 (Rifle .22)",
  Ruger1022: "Ruger 10/22",
  Winchester70: "Tundra / M70 Winchester (Sniper de caça)",
  SSG82: "SSG 82 (Rifle policial)",
  Scout5_22: "Scout (Rifle tático)",
  // SMG
  MP5K: "SG5-K / MP5 (Submetralhadora 9mm)",
  UMP45: "USG-45 / UMP (Submetralhadora .45)",
  PP19: "Bizon PP-19 (Submetralhadora 64 tiros)",
  CZ61: "KAS-74 / Skorpion CZ61",
  // Escopetas
  Saiga12K: "Vaiga / Saiga-12 (Escopeta automática)",
  Izh43Shotgun: "BK-43 (Escopeta cano duplo)",
  MP133Shotgun: "BK-133 (Escopeta de bombeamento)",
  BK133: "BK-133 Escopeta",
  Vaiga: "Vaiga Escopeta automática",
  // Pistolas
  Deagle: "Deagle .357 (Desert Eagle)",
  Magnum: "Revólver .357 Magnum",
  FNX45: "FX-45 / FNX-45 (Pistola tática)",
  Glock19: "Mlock-91 / Glock 19",
  MKII: "MK II (Pistola silenciada .22)",
  IJ70: "IJ-70 Makarov (Pistola 9x18)",
  CR75: "CR-75 (Pistola 9mm)",
  Kolt1911: "Colt 1911 (.45 ACP)",
  Longhorn: "Longhorn (Pistola sniper .308)",
  Derringer: "Derringer (Pistola de bolso)",
  // Facas e ferramentas
  CombatKnife: "Faca de Combate Militar",
  HuntingKnife: "Faca de Caça",
  KitchenKnife: "Faca de Cozinha",
  Machete: "Facão / Machete",
  FirefighterAxe: "Machado de Bombeiro",
  Hatchet: "Machadinha",
  Pickaxe: "Picareta de Mineração",
  SledgeHammer: "Marreta Pesada",
  Crowbar: "Pé de Cabra",
  Shovel: "Pá de Acampamento",
  // Roupas e proteção
  BallisticHelmet_Green: "Capacete Balístico Verde",
  PlateCarrierVest: "Colete Balístico Plate Carrier",
  BallisticVest: "Colete Balístico Policial",
  PressVest_Blue: "Colete de Imprensa Azul",
  HuntingVest: "Colete de Caçador",
  M65Jacket_Black: "Jaqueta de Campo M65 Preta",
  GorkaEJacket_Autumn: "Jaqueta Militar Gorka",
  CargoPants_Black: "Calça Cargo Militar Preta",
  Jeans_Blue: "Calça Jeans Azul",
  MilitaryBoots_Black: "Botas Militares Pretas",
  HikingBoots_Brown: "Botas de Trilha Marrom",
  Sneakers_Black: "Tênis Preto de Corrida",
  AliceBag_Camo: "Mochila Militar Alice Camo (Grande)",
  AssaultBag_Green: "Mochila de Assalto Verde",
  MountainBag_Blue: "Mochila de Montanhismo Azul (80 slots)",
  HuntingBag: "Mochila de Caça (63 slots)",
  SchoolBag: "Mochila Escolar (35 slots)",
  TacticalGloves_Black: "Luvas Táticas Militares",
  GasMask: "Máscara de Gás Militar",
  NVGoggles: "Óculos de Visão Noturna (NVG)",
  // Comida e bebida
  TunaCan: "Lata de Atum",
  SardinesCan: "Lata de Sardinha",
  BakedBeansCan: "Lata de Feijão Feijoada",
  PeachesCan: "Lata de Pêssego em Calda",
  TacticalBaconCan: "Lata de Bacon Tático",
  SpaghettiCan: "Lata de Espaguete",
  Crackers: "Bolacha Cream Cracker",
  Chips: "Batata Frita Chips",
  Apple: "Maçã Fresca",
  Plum: "Ameixa Fresca",
  Pear: "Pera Fresca",
  WaterBottle: "Garrafa de Água Mineral",
  Canteen: "Cantil Militar com Água",
  SodaCan_Cola: "Refrigerante Cola Lata",
  SodaCan_Pipsi: "Refrigerante Pipsi Lata",
  // Medicina
  BandageDressing: "Curativo Médico Esterilizado",
  Rag: "Trapo / Pano Curativo",
  TetracyclineAntibiotics: "Antibiótico Tetraciclina (Cura cólera)",
  PainkillerTablets: "Comprimidos Analgésicos",
  Morphine: "Morfina (Cura fratura rápida)",
  Epinephrine: "Epinefrina / Adrenalina",
  VitaminBottle: "Frasco de Vitaminas (Imunidade)",
  CharcoalTablets: "Carvão Ativado (Intoxicação)",
  SalineBag: "Bolsa de Soro Fisiológico (Recupera sangue)",
  POXAntidote: "Antídoto POX (Cura gás tóxico)",
  // Sobrevivência
  Matchbox: "Caixa de Fósforos",
  PetrolLighter: "Isqueiro a Gasolina",
  Flashlight: "Lanterna de Mão",
  Chemlight_White: "Glowstick Químico Branco",
  Chemlight_Green: "Glowstick Químico Verde",
  Battery9V: "Bateria 9 Volts",
  Compass: "Bússola Magnética",
  GPSReceiver: "Aparelho GPS Militar",
  DuctTape: "Fita Silver Tape (Repara roupas/equipamento)",
  SewingKit: "Kit de Costura",
  WeaponCleaningKit: "Kit de Limpeza de Armas (Repara desgaste)",
  Whetstone: "Pedra de Amolar (Afia facas e machados)",
  Nails: "Caixa de Pregos",
  CanOpener: "Abridor de Latas",
  Lockpick: "Gazua (Gazuador de portas)",
  // Animais drops
  BearPelt: "Pele / Couro de Urso Pardo",
  Pelt_Wolf: "Pele / Couro de Lobo Selvagem",
  DeerPelt: "Pele / Couro de Veado / Cervo",
  CowPelt: "Couro Bovino de Vaca",
  PigPelt: "Couro de Porco / Javali",
  GoatPelt: "Pele de Cabra",
  SheepPelt: "Lã / Pele de Ovelha",
  RabbitPelt: "Pele de Coelho / Lebre",
  SteakMeat: "Carne Crua de Caça",
  Fat: "Gordura Animal / Banha",
  Bone: "Ossos Animais",
  Guts: "Tripas / Vísceras de Animal",
  // Munições
  Ammo_556x45: "Munição 5.56x45mm (M4A1/Aug)",
  Ammo_762x39: "Munição 7.62x39mm (AKM/SKS)",
  Ammo_545x39: "Munição 5.45x39mm (AK-74)",
  Ammo_762x54: "Munição 7.62x54mmR (Mosin/SVD)",
  Ammo_308Win: "Munição .308 Winchester (Tundra/Blaze/FAL)",
  Ammo_9x19: "Munição 9x19mm (Glock/MP5/CR75)",
  Ammo_357: "Munição .357 Magnum (Deagle/Revólver)",
  Ammo_45ACP: "Munição .45 ACP (FX45/Colt/UMP)",
  Ammo_12gaPellets: "Cartuchos de Escopeta 12ga Chumbo",
  Ammo_12gaSlug: "Cartuchos de Escopeta 12ga Balote",
  Ammo_22: "Munição .22 LR",
  Mag_M4_30Rnd: "Carregador 30 tiros M4A1 (5.56)",
  Mag_AKM_30Rnd: "Carregador 30 tiros AKM (7.62)",
  Mag_Glock19_15Rnd: "Carregador 15 tiros Glock 19",
  Mag_FNX45_15Rnd: "Carregador 15 tiros FNX-45",
  Mag_IJ70_8Rnd: "Carregador 8 tiros IJ-70 Makarov",
  // Armas e Equipamentos Recentes (DayZ 1.20 - 1.26 Frostline)
  DMR: "DMR (Designated Marksman Rifle .308)",
  Mag_DMR_10Rnd: "Carregador 10 tiros DMR (.308)",
  Mag_DMR_20Rnd: "Carregador 20 tiros DMR (.308)",
  SV98: "SV-98 (Rifle Sniper Tático 7.62x54R)",
  Mag_SV98_10Rnd: "Carregador 10 tiros SV-98",
  Vikhr: "SR-3M Vikhr (Fuzil Compacto 9x39mm)",
  Mag_Vikhr_30Rnd: "Carregador 30 tiros Vikhr (9x39mm)",
  M14: "M14 (Rifle de Batalha Militar)",
  Crossbow_Autumn: "Besta de Caça (Silenciosa)",
  Crossbow_Black: "Besta Tática Preta",
  Crossbow_Wood: "Besta de Madeira Clássica",
  Ammo_HuntingBolt: "Flechas de Caça para Besta",
  Ammo_ImprovisedBolt: "Flechas Artesanais para Besta",
  SawedoffMosin9130: "Mosin 91/30 Cano Serrado",
  SawedoffIzh43Shotgun: "Escopeta BK-43 Cano Serrado",
  SawedoffB95: "Blaze 95 Cano Serrado",
  SawedoffMagnum: "Magnum .357 Cano Curto",
  // Acessórios e Miras Novas
  PPOptic: "Mira Óptica 1P78 (Russa)",
  KazuarOptic: "Mira Noturna 1PN93 Kazuar (NVG)",
  StarlightOptic: "Mira Noturna Starlight Militar",
  // Explosivos e Utilitários Novos
  Plastic_Explosive: "Explosivo Plástico C4",
  RemoteDetonator: "Detonador Remoto para C4",
  RemoteDetonatorTrigger: "Gatilho de Detonação Remota",
  AlarmClock: "Despertador com Timer (Armadilhas)",
  KitchenTimer: "Timer de Cozinha para IED",
  ImprovisedExplosive: "Bolsa de Explosivo IED Artesanal",
  Blowtorch: "Maçarico a Gás de Solda",
  LargeGasCanister: "Botijão de Gás Grande",
  GasMask_Filter: "Filtro para Máscara de Gás",
  POX_Vial: "Frasco com Gás Químico Tóxico POX",
  FieldShovel: "Pá Dobrável Tática Militar",
  MedievalSword: "Espada Longa Medieval",
  Mace: "Maça de Ferro Medieval",
  NorseAxe: "Machado Viking Nórdico",
  Chainmail_Coif: "Cota de Malha (Capuz)",
  Chainmail_Chest: "Cota de Malha (Torso)",
  Chainmail_Leggings: "Cota de Malha (Pernas)",
  ChestRig_Green: "Colete Peitoral Chest Rig Verde",
  ChestRig_Black: "Colete Peitoral Chest Rig Preto",
  // Veículo Humvee M1025 e Peças Novas
  Offroad_02_Wheel: "Roda de Humvee Militar M1025",
  Offroad_02_Door_1_1: "Porta de Humvee Militar M1025",
  Offroad_02_Hood: "Capô de Humvee Militar",
  Offroad_02_Trunk: "Porta-Malas de Humvee Militar",
  GlowPlug: "Vela de Aquecimento Glow Plug (Humvee/M3S)",
  // Roupas de Inverno / Frostline
  WinterCoats_Green: "Casaco de Frio Extremo Verde",
  WinterCoats_Blue: "Casaco de Frio Extremo Azul",
  WoolCoat_Black: "Casaco Pesado de Lã Preta",
  ReindeerPelt: "Pele de Rena Ártica",
  FoxPelt: "Pele de Raposa Silvestre",
};

export const ITEMS: ItemDef[] = [
  // ===== Rifles de assalto e batalha =====
  ["M4A1", 10, W, MIL],
  ["AKM", 8, W, MIL],
  ["AK101", 6, W, MIL],
  ["AK74", 10, W, MIL],
  ["AKS74U", 12, W, MIL],
  ["AURAX", 5, W, MIL],
  ["Aug", 5, W, MIL],
  ["FAL", 6, W, MIL],
  ["M16A2", 6, W, MIL],
  ["VSS", 5, W, MIL],
  ["ASVAL", 5, W, MIL],
  ["M14", 8, W, MIL],
  ["Vikhr", 8, W, MIL],
  // ===== Rifles de precisão / caça / Snipers Recentes =====
  ["DMR", 6, W, MIL],
  ["SV98", 5, W, MIL],
  ["SVD", 5, W, MIL],
  ["Mosin9130", 25, W, HUNT],
  ["SKS", 15, W, MIL],
  ["CR527", 20, W, HUNT],
  ["Blaze", 20, W, HUNT],
  ["Repeater", 20, W, HUNT],
  ["Sporter22", 25, W, HUNT],
  ["Ruger1022", 20, W, HUNT],
  ["Trumpet", 15, W, HUNT],
  ["SSG82", 5, W, MIL],
  ["Scout5_22", 12, W, MIL],
  ["Winchester70", 8, W, HUNT],
  ["Crossbow_Autumn", 15, W, HUNT],
  ["Crossbow_Black", 12, W, HUNT],
  ["Crossbow_Wood", 15, W, HUNT],
  ["SawedoffMosin9130", 12, W, HUNT],
  ["SawedoffB95", 10, W, HUNT],
  ["SawedoffIzh43Shotgun", 15, W, HUNT],
  ["SawedoffMagnum", 10, W, COAST],
  // ===== Submetralhadoras =====
  ["MP5K", 15, W, POL],
  ["UMP45", 12, W, POL],
  ["PP19", 12, W, POL],
  ["Bizon", 6, W, MIL],
  ["CZ61", 15, W, POL],
  // ===== Escopetas =====
  ["Saiga12K", 8, W, MIL],
  ["Izh43Shotgun", 25, W, HUNT],
  ["MP133Shotgun", 25, W, POL],
  ["BK133", 20, W, HUNT],
  ["Vaiga", 6, W, MIL],
  // ===== Pistolas =====
  ["Deagle", 10, W, POL],
  ["Magnum", 8, W, COAST],
  ["FNX45", 12, W, POL],
  ["Glock19", 15, W, POL],
  ["MKII", 10, W, TOWN],
  ["IJ70", 20, W, POL],
  ["CR75", 15, W, POL],
  ["P1", 15, W, POL],
  ["Kolt1911", 12, W, POL],
  ["Longhorn", 5, W, HUNT],
  ["Derringer", 10, W, COAST],
  // ===== Lançadores / explosivos =====
  ["M79", 3, W, MIL],
  ["Grenade_RDG5", 10, W, MIL],
  ["Grenade_ChemGas", 8, W, MIL],
  ["FlashGrenade", 10, W, MIL],
  ["SmokeGrenade_Red", 12, W, MIL],
  ["LandMineTrap", 5, W, MIL],
  ["ClaymoreMine", 3, W, MIL],
  // ===== Armas brancas =====
  ["Machete", 20, T, HUNT],
  ["CombatKnife", 15, T, MIL],
  ["HuntingKnife", 20, T, HUNT],
  ["KitchenKnife", 30, T, TOWN],
  ["FirefighterAxe", 12, T, IND],
  ["Hatchet", 20, T, IND],
  ["Pickaxe", 10, T, IND],
  ["SledgeHammer", 10, T, IND],
  ["BaseballBat", 20, T, TOWN],
  ["Crowbar", 15, T, IND],
  ["Shovel", 15, T, IND],
  ["FarmingHoe", 10, T, VIL],
  // ===== Miras e acessórios de arma =====
  ["ACOGOptic", 8, T, MIL],
  ["PSO1Optic", 8, T, MIL],
  ["KobraOptic", 10, T, MIL],
  ["PUScopeOptic", 12, T, HUNT],
  ["ReflexOptic", 10, T, MIL],
  ["HuntingOptic", 8, T, HUNT],
  ["M4_Suppressor", 8, T, MIL],
  ["PistolSuppressor", 8, T, MIL],
  ["AK_Suppressor", 8, T, MIL],
  ["M4_CQBBttstck", 10, T, MIL],
  ["M4_OEBttstck", 10, T, MIL],
  ["AK_WoodBttstck", 12, T, MIL],
  ["M4_RISHndgrd", 10, T, MIL],
  ["AK_RailHndgrd", 10, T, MIL],
  ["GhillieAtt_Woodland", 5, C, MIL],
  ["Bipod", 8, T, MIL],
  ["UniversalLight", 12, T, MIL],
  ["PistolLight", 12, T, POL],
  ["PPOptic", 10, T, MIL],
  ["KazuarOptic", 6, T, MIL],
  ["StarlightOptic", 5, T, MIL],
  // ===== Carregadores =====
  ["Mag_M4_30Rnd", 20, W, MIL],
  ["Mag_AKM_30Rnd", 20, W, MIL],
  ["Mag_AK101_30Rnd", 15, W, MIL],
  ["Mag_AK74_30Rnd", 20, W, MIL],
  ["Mag_SVD_10Rnd", 12, W, MIL],
  ["Mag_FAL_20Rnd", 12, W, MIL],
  ["Mag_MP5_30Rnd", 20, W, POL],
  ["Mag_UMP_25Rnd", 15, W, POL],
  ["Mag_Deagle_9rnd", 12, W, POL],
  ["Mag_FNX45_15Rnd", 15, W, POL],
  ["Mag_Glock19_15Rnd", 18, W, POL],
  ["Mag_CZ61_20Rnd", 15, W, POL],
  ["Mag_Saiga12K_8Rnd", 12, W, MIL],
  ["Mag_VSS_10Rnd", 10, W, MIL],
  ["Mag_VAL_20Rnd", 10, W, MIL],
  ["Mag_PP19_64Rnd", 12, W, POL],
  ["Mag_Ruger1022_30Rnd", 15, W, HUNT],
  ["Mag_CZ527_5rnd", 15, W, HUNT],
  ["Mag_M14_20Rnd", 8, W, MIL],
  ["Mag_DMR_10Rnd", 15, W, MIL],
  ["Mag_DMR_20Rnd", 10, W, MIL],
  ["Mag_SV98_10Rnd", 15, W, MIL],
  ["Mag_Vikhr_30Rnd", 15, W, MIL],
  // ===== Munição =====
  ["Ammo_556x45", 40, W, MIL],
  ["Ammo_762x39", 40, W, MIL],
  ["Ammo_545x39", 35, W, MIL],
  ["Ammo_762x54", 30, W, MIL],
  ["Ammo_308Win", 30, W, HUNT],
  ["Ammo_9x19", 40, W, POL],
  ["Ammo_9x39", 25, W, MIL],
  ["Ammo_45ACP", 30, W, POL],
  ["Ammo_12gaPellets", 40, W, HUNT],
  ["Ammo_12gaSlug", 30, W, HUNT],
  ["Ammo_22", 35, W, HUNT],
  ["Ammo_357", 20, W, COAST],
  ["Ammo_380", 25, W, POL],
  ["Ammo_40mm_Grenade", 10, W, MIL],
  ["Ammo_9x39AP", 15, W, MIL],
  ["Ammo_556x45Tracer", 20, W, MIL],
  ["Ammo_HuntingBolt", 35, W, HUNT],
  ["Ammo_ImprovisedBolt", 25, W, HUNT],
  // ===== Roupas — cabeça =====
  ["BallisticHelmet_Green", 8, C, MIL],
  ["GorkaHelmet", 8, C, MIL],
  ["Mich2001Helmet", 5, C, MIL],
  ["ZSh3PilotHelmet", 8, C, MIL],
  ["MotoHelmet_Black", 10, C, TOWN],
  ["HockeyHelmet", 12, C, TOWN],
  ["BaseballCap_Blue", 30, C, TOWN],
  ["BeanieHat_Brown", 30, C, TOWN],
  ["Ushanka_Black", 20, C, VIL],
  ["CowboyHat_Brown", 15, C, VIL],
  ["BoonieHat_DPM", 15, C, MIL],
  ["OfficerCap", 8, C, MIL],
  ["PoliceCap", 15, C, POL],
  ["NBC_Hood", 8, C, MIL],
  ["SkateHelmet_Black", 12, C, TOWN],
  ["WeldingMask", 8, C, IND],
  // ===== Roupas — máscaras =====
  ["GasMask", 10, C, MIL],
  ["GP5GasMask", 12, C, MIL],
  ["NBCRespirator", 8, C, MIL],
  ["BalaclavaMask_Black", 20, C, TOWN],
  ["SkiMask_Black", 15, C, MIL],
  ["BandanaMask_Red", 25, C, TOWN],
  ["SurgicalMask", 25, C, MED],
  // ===== Roupas — óculos =====
  ["SportGlasses_Black", 20, C, TOWN],
  ["AviatorGlasses", 20, C, TOWN],
  ["TacticalGoggles", 10, C, MIL],
  ["NVGoggles", 5, C, MIL],
  // ===== Roupas — torso =====
  ["M65Jacket_Black", 15, C, MIL],
  ["GorkaEJacket_Autumn", 10, C, MIL],
  ["TacticalShirt_Olive", 15, C, MIL],
  ["TTsKOJacket_Camo", 12, C, MIL],
  ["HikingJacket_Blue", 25, C, TOWN],
  ["Raincoat_Green", 20, C, TOWN],
  ["Hoodie_Blue", 30, C, TOWN],
  ["TShirt_Green", 30, C, TOWN],
  ["TracksuitJacket_Black", 25, C, TOWN],
  ["Shirt_BlueCheck", 30, C, TOWN],
  ["DenimJacket", 25, C, TOWN],
  ["LeatherJacket_Natural", 15, C, TOWN],
  ["NBC_Jacket", 8, C, MIL],
  ["FirefighterJacket_Black", 8, C, IND],
  ["ParamedicJacket_Blue", 12, C, MED],
  ["PoliceJacket", 12, C, POL],
  ["PrisonerJacket", 10, C, POL],
  ["LabCoat", 15, C, MED],
  ["JumpsuitJacket_Blue", 15, C, IND],
  ["QuiltedJacket_Black", 20, C, VIL],
  ["BomberJacket_Black", 20, C, TOWN],
  ["WomensSuitJacket_Beige", 15, C, OFF],
  // ===== Roupas — coletes =====
  ["PlateCarrierVest", 8, C, MIL],
  ["BallisticVest", 10, C, POL],
  ["SmershVest", 6, C, MIL],
  ["HuntingVest", 15, C, HUNT],
  ["PressVest_Blue", 10, C, TOWN],
  ["UKAssVest_Khaki", 12, C, MIL],
  ["PoliceVest", 10, C, POL],
  ["ChestHolster", 12, C, MIL],
  // ===== Roupas — pernas =====
  ["CargoPants_Black", 25, C, TOWN],
  ["GorkaPants_Autumn", 10, C, MIL],
  ["TacticalPants_Olive", 12, C, MIL],
  ["Jeans_Blue", 30, C, TOWN],
  ["TracksuitPants_Black", 25, C, TOWN],
  ["HunterPants_Autumn", 15, C, HUNT],
  ["NBC_Pants", 8, C, MIL],
  ["PolicePants", 12, C, POL],
  ["JumpsuitPants_Blue", 15, C, IND],
  ["ShortJeans_Blue", 25, C, TOWN],
  // ===== Roupas — pés =====
  ["MilitaryBoots_Black", 12, C, MIL],
  ["JungleBoots_Green", 12, C, MIL],
  ["HikingBoots_Brown", 20, C, TOWN],
  ["Sneakers_Black", 30, C, TOWN],
  ["WorkingBoots_Brown", 20, C, IND],
  ["NBC_Boots", 8, C, MIL],
  ["Wellies_Green", 20, C, VIL],
  ["DressShoes_Black", 15, C, OFF],
  // ===== Roupas — mãos =====
  ["TacticalGloves_Black", 12, C, MIL],
  ["WorkingGloves_Brown", 25, C, IND],
  ["WoolGloves_Tan", 25, C, TOWN],
  ["NBC_Gloves", 8, C, MIL],
  ["SurgicalGloves_Blue", 25, C, MED],
  // ===== Mochilas =====
  ["AliceBag_Camo", 12, CT, MIL],
  ["AssaultBag_Green", 12, CT, MIL],
  ["CoyoteBag_Brown", 10, CT, MIL],
  ["MountainBag_Blue", 15, CT, TOWN],
  ["HuntingBag", 15, CT, HUNT],
  ["SchoolBag", 25, CT, SCHOOL],
  ["SlingBag_Black", 15, CT, TOWN],
  ["DryBag_Blue", 12, CT, COAST],
  ["GhillieSuit_Woodland", 5, C, MIL],
  ["GhillieTop_Woodland", 8, C, MIL],
  ["ImprovisedBag", 10, CT, VIL],
  ["CanvasBag_Medical", 12, CT, MED],
  // ===== Cintos e coldres =====
  ["MilitaryBelt", 12, C, MIL],
  ["RopeBelt", 15, C, TOWN],
  ["HipHolster", 10, C, POL],
  ["PlateCarrierHolster", 8, C, MIL],
  ["NylonKnifeSheath", 15, C, MIL],
  // ===== Comida =====
  ["TunaCan", 40, F, TOWN],
  ["SardinesCan", 35, F, TOWN],
  ["BakedBeansCan", 35, F, TOWN],
  ["PeachesCan", 30, F, TOWN],
  ["TacticalBaconCan", 25, F, MIL],
  ["SpaghettiCan", 30, F, TOWN],
  ["Lunchmeat", 25, F, TOWN],
  ["Pate", 25, F, TOWN],
  ["Crackers", 35, F, TOWN],
  ["Chips", 30, F, TOWN],
  ["SaltySticks", 30, F, TOWN],
  ["PowderedMilk", 25, F, TOWN],
  ["Rice", 20, F, TOWN],
  ["Cereal", 20, F, SCHOOL],
  ["Zagorky", 25, F, TOWN],
  ["ZagorkyChocolate", 20, F, TOWN],
  ["Apple", 40, F, VIL],
  ["Banana", 30, F, TOWN],
  ["Orange", 30, F, TOWN],
  ["Plum", 35, F, VIL],
  ["Pear", 35, F, VIL],
  ["Kiwi", 25, F, TOWN],
  ["Tomato", 30, F, VIL],
  ["Potato", 30, F, VIL],
  ["GreenBellPepper", 25, F, VIL],
  ["Zucchini", 25, F, VIL],
  ["Pumpkin", 10, F, VIL],
  ["AgaricusMushroom", 20, F, HUNT],
  ["AmanitaMushroom", 15, F, HUNT],
  ["BoletusMushroom", 20, F, HUNT],
  ["MacrolepiotaMushroom", 15, F, HUNT],
  // ===== Bebidas =====
  ["WaterBottle", 30, F, TOWN],
  ["Canteen", 20, F, MIL],
  ["SodaCan_Cola", 35, F, TOWN],
  ["SodaCan_Kvass", 30, F, TOWN],
  ["SodaCan_Pipsi", 35, F, TOWN],
  ["SodaCan_Spite", 35, F, TOWN],
  ["Vodka", 15, F, TOWN],
  ["BeerCan", 25, F, TOWN],
  // ===== Medicina =====
  ["BandageDressing", 35, T, MED],
  ["Rag", 40, T, TOWN],
  ["DisinfectantSpray", 25, T, MED],
  ["AlcoholTincture", 25, T, MED],
  ["Morphine", 15, T, MED],
  ["Epinephrine", 15, T, MED],
  ["PainkillerTablets", 30, T, MED],
  ["TetracyclineAntibiotics", 25, T, MED],
  ["VitaminBottle", 30, T, MED],
  ["CharcoalTablets", 30, T, MED],
  ["SalineBag", 20, T, MED],
  ["BloodBagEmpty", 15, T, MED],
  ["StartKitIV", 12, T, MED],
  ["Syringe", 20, T, MED],
  ["Thermometer", 15, T, MED],
  ["SurgicalKit", 8, T, MED],
  ["POXAntidote", 5, T, MED],
  // ===== Ferramentas / sobrevivência =====
  ["Matchbox", 35, T, TOWN],
  ["PetrolLighter", 25, T, TOWN],
  ["HandDrillKit", 15, T, VIL],
  ["Firewood", 30, T, VIL],
  ["Rags", 40, T, TOWN],
  ["Paper", 30, T, OFF],
  ["DuctTape", 25, T, IND],
  ["SewingKit", 25, T, TOWN],
  ["WeaponCleaningKit", 15, T, MIL],
  ["Whetstone", 20, T, IND],
  ["Nails", 30, T, IND],
  ["Hammer", 20, T, IND],
  ["Screwdriver", 25, T, IND],
  ["Wrench", 20, T, IND],
  ["LugWrench", 15, T, IND],
  ["TireRepairKit", 15, T, IND],
  ["ElectronicRepairKit", 10, T, IND],
  ["PipeWrench", 12, T, IND],
  ["CanOpener", 25, T, TOWN],
  ["Pliers", 20, T, IND],
  ["Handsaw", 20, T, IND],
  ["Lockpick", 8, T, POL],
  ["FishingRod", 15, T, COAST],
  ["FishingHook", 20, T, COAST],
  ["BoneFishingHook", 10, T, HUNT],
  ["Worm", 30, T, VIL],
  ["Compass", 20, T, TOWN],
  ["OrienteeringCompass", 15, T, MIL],
  ["Map_Navigation", 20, T, TOWN],
  ["GPSReceiver", 8, T, MIL],
  ["Binoculars", 15, T, TOWN],
  ["Rangefinder", 8, T, MIL],
  ["Flashlight", 30, T, TOWN],
  ["Headtorch_Black", 20, T, IND],
  ["Battery9V", 30, T, TOWN],
  ["Powerbank", 12, T, TOWN],
  ["CableReel", 10, T, IND],
  ["Generator_Fuel", 5, T, IND],
  ["PersonalRadio", 15, T, TOWN],
  ["Megaphone", 10, T, POL],
  ["TeddyBear_Brown", 15, T, SCHOOL],
  ["Camera", 12, T, TOWN],
  ["TentCar", 5, CT, HUNT],
  ["TentMedium", 8, CT, HUNT],
  ["TentLarge", 5, CT, MIL],
  ["ShelterKit", 15, CT, HUNT],
  ["SleepingBag_Blue", 15, T, HUNT],
  ["CookingPot", 20, T, TOWN],
  ["FryingPan", 20, T, TOWN],
  ["PortableGasStove", 15, T, HUNT],
  ["PortableGasLamp", 12, T, HUNT],
  ["GasCanister_Medium", 20, T, HUNT],
  ["Heatpack", 20, T, MED],
  ["HandWarmer", 15, T, MED],
  // ===== Construção de base =====
  ["FenceKit", 10, T, IND],
  ["TerritoryFlagKit", 8, T, IND],
  ["WatchtowerKit", 5, T, IND],
  ["MetalPlate", 15, T, IND],
  ["SheetMetal", 12, T, IND],
  ["WoodenLog", 15, T, VIL],
  ["WoodenPlank", 25, T, IND],
  ["CombinationLock", 10, T, IND],
  ["CombinationLock4", 8, T, IND],
  ["CamoNet", 10, T, MIL],
  ["BarbedWire", 12, T, IND],
  ["MetalWire", 12, T, IND],
  ["Trap_FishNet", 10, T, COAST],
  ["Trap_SmallFish", 12, T, COAST],
  ["Trap_RabbitSnare", 15, T, HUNT],
  ["Spotlight", 5, T, IND],
  ["XmasLights", 10, T, TOWN],
  // ===== Peças de veículo =====
  ["CarBattery", 15, V, IND],
  ["TruckBattery", 10, V, IND],
  ["SparkPlug", 20, V, IND],
  ["CarRadiator", 12, V, IND],
  ["HeadlightH7", 20, V, IND],
  ["EngineBelt", 15, V, IND],
  ["BrakeFluid", 15, V, IND],
  ["TireRepairKitV", 15, V, IND],
  ["HatchbackWheel", 15, V, IND],
  ["TruckWheel", 10, V, IND],
  ["OffroadWheel", 12, V, IND],
  ["SedanWheel", 15, V, IND],
  ["HatchbackDoors_Driver", 8, V, IND],
  ["OffroadHatchback_Doors_Driver", 8, V, IND],
  ["Truck_01_Door1", 5, V, IND],
  ["HatchbackTrunk", 8, V, IND],
  ["OffroadHatchback_Hood", 8, V, IND],
  ["JerryCan", 12, V, IND],
  ["CanisterGasoline", 12, V, IND],
  // ===== Diversos =====
  ["MoneyRuble1", 0, T, TOWN],
  ["ChristmasTree", 3, T, TOWN],
  ["Bone", 25, T, HUNT],
  ["Pelt_Wolf", 15, T, HUNT],
  ["BearPelt", 8, T, HUNT],
  ["DeerPelt", 15, T, HUNT],
  ["CowPelt", 15, T, VIL],
  ["PigPelt", 15, T, VIL],
  ["GoatPelt", 15, T, VIL],
  ["SheepPelt", 15, T, VIL],
  ["RabbitPelt", 20, T, HUNT],
  ["HumanSteakMeat", 5, F, HUNT],
  ["SteakMeat", 15, F, HUNT],
  ["Guts", 20, T, HUNT],
  ["Fat", 20, T, HUNT],
  ["Antibiotics_Syringe", 10, T, MED],
  ["ChelatingTablets", 15, T, MED],
  ["DeadRat", 10, F, VIL],
  ["Carp", 15, F, COAST],
  ["Mackerel", 15, F, COAST],
  ["Sardines", 15, F, COAST],
  ["Bitterlings", 15, F, COAST],
];

// Eventos vanilla do DayZ: [nome, nominal, posição, limite]
type EventDef = [name: string, nominal: number, position: string, limit: string];
const EVENTS: EventDef[] = [
  // ===== Comboios e Quedas Especiais (Eventos Dinâmicos Famosos) =====
  ["PoliceConvoy", 3, "fixed", "custom"],
  ["MilitaryConvoy", 3, "fixed", "custom"],
  ["HeliCrash", 3, "player", "custom"],
  ["Wreck_UH1Y", 3, "player", "custom"],
  ["Wreck_Mi8", 3, "player", "custom"],
  ["TrainWreck", 4, "fixed", "custom"],
  ["SantaSleigh", 2, "player", "custom"],
  // Veículos
  ["VehicleOffroadHatchback", 3, "fixed", "child"],
  ["VehicleOffroad02", 3, "fixed", "child"],
  ["VehicleSedan02", 3, "fixed", "child"],
  ["VehicleHatchback02", 3, "fixed", "child"],
  ["VehicleTruck01", 2, "fixed", "child"],
  // Zonas contaminadas
  ["StaticContaminatedArea", 10, "fixed", "mixed"],
  ["DynamicContaminatedArea", 6, "player", "mixed"],
  // Animais
  ["AnimalBear", 5, "player", "child"],
  ["AnimalWolf", 8, "player", "child"],
  ["AnimalDeer", 15, "player", "child"],
  ["AnimalRoeDeer", 15, "player", "child"],
  ["AnimalWildBoar", 10, "player", "child"],
  ["AnimalGoat", 12, "player", "child"],
  ["AnimalSheep", 12, "player", "child"],
  ["AnimalPig", 12, "player", "child"],
  ["AnimalCow", 10, "player", "child"],
  ["AnimalChicken", 25, "player", "child"],
  ["AnimalFox", 8, "player", "child"],
  ["AnimalHare", 20, "player", "child"],
  // Infectados
  ["InfectedArmy", 60, "player", "child"],
  ["InfectedPolice", 40, "player", "child"],
  ["InfectedMedic", 30, "player", "child"],
  ["InfectedFirefighter", 25, "player", "child"],
  ["InfectedIndustrial", 50, "player", "child"],
  ["InfectedSolier", 40, "player", "child"],
  ["InfectedNBC", 20, "player", "child"],
  // Eventos de mundo
  ["TrajectoryCalculation", 4, "player", "mixed"],
];

const typeXml = ([name, nominal, category, usages]: ItemDef) => `    <type name="${name}">
        <nominal>${nominal}</nominal>
        <lifetime>7200</lifetime>
        <restock>0</restock>
        <min>${Math.floor(nominal / 2)}</min>
        <quantmin>-1</quantmin>
        <quantmax>-1</quantmax>
        <cost>100</cost>
        <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
        <category name="${category}"/>
${usages.map((u) => `        <usage name="${u}"/>`).join("\n")}
    </type>`;

const typesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<types>
${ITEMS.map(typeXml).join("\n")}
</types>
`;

const eventXml = ([name, nominal, position, limit]: EventDef) => `    <event name="${name}">
        <nominal>${nominal}</nominal>
        <min>${Math.max(1, Math.floor(nominal / 2))}</min>
        <max>${nominal * 2}</max>
        <lifetime>300</lifetime>
        <restock>0</restock>
        <saferadius>500</saferadius>
        <distanceradius>500</distanceradius>
        <cleanupradius>100</cleanupradius>
        <flags deletable="0" init_random="0" remove_damaged="1"/>
        <position>${position}</position>
        <limit>${limit}</limit>
        <active>1</active>
    </event>`;

const eventsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<events>
${EVENTS.map(eventXml).join("\n")}
</events>
`;

const globalsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="CleanupAvoidance" type="0" value="100"/>
    <var name="CleanupLifetimeLimitInfected" type="0" value="330"/>
    <var name="CleanupLifetimeLimitPlayerCorpses" type="0" value="3600"/>
    <var name="TimeLogout" type="0" value="5"/>
    <var name="TimeSpawnAnimals" type="0" value="5"/>
    <var name="ZombieMaxCount" type="0" value="500"/>
</variables>
`;

const gameplayJson = JSON.stringify(
  {
    version: 131,
    GeneralData: {
      disableBaseDamage: 0,
      disableContainerDamage: 0,
      disableRespawnDialog: 0,
      lightingConfig: 0,
    },
    PlayerData: {
      disablePersonalLight: 0,
      StaminaData: { sprintStaminaModifierErc: 1.0, sprintStaminaModifierCro: 1.0 },
    },
    WorldsData: {
      environmentMinTemps: [-3, -3, -3, -3, -3, -3, -3, -3, -3, -3, -3, -3],
      environmentMaxTemps: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
    },
  },
  null,
  2,
);

const cfgrandompresetsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<randompresets>
    <!-- Zumbis Civis (vilas e cidades) -->
    <lootPresets name="zombieCivilian">
        <item name="Apple" chance="0.25" />
        <item name="Plum" chance="0.20" />
        <item name="SodaCan_Cola" chance="0.15" />
        <item name="Rag" chance="0.30" />
        <item name="Matchbox" chance="0.15" />
        <item name="KitchenKnife" chance="0.08" />
    </lootPresets>
    <!-- Zumbis Militares -->
    <lootPresets name="zombieSoldier">
        <item name="Ammo_556x45" chance="0.25" />
        <item name="Ammo_762x39" chance="0.25" />
        <item name="TacticalBaconCan" chance="0.20" />
        <item name="CombatKnife" chance="0.15" />
        <item name="BandageDressing" chance="0.30" />
        <item name="Mag_M4_30Rnd" chance="0.08" />
    </lootPresets>
    <!-- Zumbis Policiais -->
    <lootPresets name="zombiePolice">
        <item name="Ammo_9x19" chance="0.30" />
        <item name="Ammo_357" chance="0.20" />
        <item name="Flashlight" chance="0.25" />
        <item name="Battery9V" chance="0.20" />
        <item name="Lockpick" chance="0.12" />
        <item name="Mag_Glock19_15Rnd" chance="0.08" />
    </lootPresets>
    <!-- Zumbis Médicos -->
    <lootPresets name="zombieMedic">
        <item name="BandageDressing" chance="0.45" />
        <item name="PainkillerTablets" chance="0.30" />
        <item name="TetracyclineAntibiotics" chance="0.25" />
        <item name="Morphine" chance="0.15" />
        <item name="VitaminBottle" chance="0.25" />
        <item name="SalineBag" chance="0.10" />
    </lootPresets>
    <!-- Zumbis Bombeiros -->
    <lootPresets name="zombieFirefighter">
        <item name="FirefighterAxe" chance="0.15" />
        <item name="Matchbox" chance="0.30" />
        <item name="BandageDressing" chance="0.25" />
        <item name="Flashlight" chance="0.20" />
    </lootPresets>
    <!-- Zumbis Industriais -->
    <lootPresets name="zombieIndustrial">
        <item name="DuctTape" chance="0.25" />
        <item name="Nails" chance="0.20" />
        <item name="Hammer" chance="0.15" />
        <item name="Wrench" chance="0.15" />
        <item name="Pliers" chance="0.15" />
        <item name="Crowbar" chance="0.10" />
    </lootPresets>
    <!-- Zumbis Rurais / Fazenda -->
    <lootPresets name="zombieVillager">
        <item name="Plum" chance="0.25" />
        <item name="Pear" chance="0.25" />
        <item name="KitchenKnife" chance="0.15" />
        <item name="Rag" chance="0.30" />
        <item name="Matchbox" chance="0.20" />
    </lootPresets>
    <!-- Zumbis Caçadores -->
    <lootPresets name="zombieHunter">
        <item name="HuntingKnife" chance="0.20" />
        <item name="Matchbox" chance="0.30" />
        <item name="Ammo_308Win" chance="0.25" />
        <item name="Ammo_12gaPellets" chance="0.25" />
        <item name="Compass" chance="0.15" />
    </lootPresets>
    <!-- Zumbis NBC (Gás tóxico) -->
    <lootPresets name="zombieNBC">
        <item name="POXAntidote" chance="0.15" />
        <item name="CharcoalTablets" chance="0.30" />
        <item name="TetracyclineAntibiotics" chance="0.20" />
        <item name="BandageDressing" chance="0.30" />
    </lootPresets>
    <!-- Zumbis Prisão -->
    <lootPresets name="zombiePrisoner">
        <item name="Lockpick" chance="0.25" />
        <item name="KitchenKnife" chance="0.20" />
        <item name="Rag" chance="0.35" />
        <item name="Matchbox" chance="0.15" />
    </lootPresets>

    <!-- Loot de Animais Selvagens e Caça -->
    <cargo chance="1.0" name="animalBearLoot">
        <item name="BearPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
        <item name="Guts" chance="0.8" />
    </cargo>
    <cargo chance="1.0" name="animalWolfLoot">
        <item name="Pelt_Wolf" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
        <item name="Guts" chance="0.8" />
    </cargo>
    <cargo chance="1.0" name="animalDeerLoot">
        <item name="DeerPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
        <item name="Guts" chance="0.8" />
    </cargo>
    <cargo chance="1.0" name="animalBoarLoot">
        <item name="PigPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
        <item name="Guts" chance="0.8" />
    </cargo>
    <cargo chance="1.0" name="animalCowLoot">
        <item name="CowPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
        <item name="Guts" chance="0.8" />
    </cargo>
    <cargo chance="1.0" name="animalGoatLoot">
        <item name="GoatPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" />
        <item name="Bone" chance="1.0" />
    </cargo>
    <cargo chance="1.0" name="animalPigLoot">
        <item name="PigPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
    </cargo>
    <cargo chance="1.0" name="animalSheepLoot">
        <item name="SheepPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Fat" chance="1.0" />
        <item name="Bone" chance="1.0" />
    </cargo>
    <cargo chance="1.0" name="animalChickenLoot">
        <item name="SteakMeat" chance="1.0" quantmin="100" quantmax="100" />
        <item name="Bone" chance="1.0" />
    </cargo>
    <cargo chance="1.0" name="animalFoxLoot">
        <item name="Pelt_Wolf" chance="0.8" />
        <item name="SteakMeat" chance="1.0" />
        <item name="Bone" chance="1.0" />
    </cargo>
    <cargo chance="1.0" name="animalHareLoot">
        <item name="RabbitPelt" chance="1.0" />
        <item name="SteakMeat" chance="1.0" />
        <item name="Bone" chance="1.0" />
    </cargo>
</randompresets>
`;

const cfgspawnabletypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<spawnabletypes>
    <!-- Loot inicial que o jogador começa ao nascer no mapa -->
    <type name="SurvivorBase">
        <attachments chance="1.00">
            <item name="TShirt_Green" chance="1.00" />
            <item name="Jeans_Blue" chance="1.00" />
            <item name="Sneakers_Black" chance="1.00" />
        </attachments>
        <cargo chance="1.00">
            <item name="Plum" chance="1.00" />
            <item name="BandageDressing" chance="1.00" quantmin="100" quantmax="100" />
            <item name="Chemlight_White" chance="1.00" />
            <item name="Matchbox" chance="1.00" quantmin="100" quantmax="100" />
        </cargo>
    </type>
    <type name="SurvivorMale_Base">
        <attachments chance="1.00">
            <item name="TShirt_Green" chance="1.00" />
            <item name="Jeans_Blue" chance="1.00" />
            <item name="Sneakers_Black" chance="1.00" />
        </attachments>
        <cargo chance="1.00">
            <item name="Plum" chance="1.00" />
            <item name="BandageDressing" chance="1.00" quantmin="100" quantmax="100" />
            <item name="Chemlight_White" chance="1.00" />
            <item name="Matchbox" chance="1.00" quantmin="100" quantmax="100" />
        </cargo>
    </type>
    <type name="SurvivorFemale_Base">
        <attachments chance="1.00">
            <item name="TShirt_Green" chance="1.00" />
            <item name="Jeans_Blue" chance="1.00" />
            <item name="Sneakers_Black" chance="1.00" />
        </attachments>
        <cargo chance="1.00">
            <item name="Plum" chance="1.00" />
            <item name="BandageDressing" chance="1.00" quantmin="100" quantmax="100" />
            <item name="Chemlight_White" chance="1.00" />
            <item name="Matchbox" chance="1.00" quantmin="100" quantmax="100" />
        </cargo>
    </type>

    <!-- Conexão do loot de animais -->
    <type name="Animal_UrsusArctos">
        <cargo preset="animalBearLoot" />
    </type>
    <type name="Animal_CanisLupus">
        <cargo preset="animalWolfLoot" />
    </type>
    <type name="Animal_CervusElaphus">
        <cargo preset="animalDeerLoot" />
    </type>
    <type name="Animal_CapreolusCapreolus">
        <cargo preset="animalDeerLoot" />
    </type>
    <type name="Animal_SusScrofa">
        <cargo preset="animalBoarLoot" />
    </type>
    <type name="Animal_BosTaurus">
        <cargo preset="animalCowLoot" />
    </type>
    <type name="Animal_CapraHircus">
        <cargo preset="animalGoatLoot" />
    </type>
    <type name="Animal_SusDomesticus">
        <cargo preset="animalPigLoot" />
    </type>
    <type name="Animal_OvisAries">
        <cargo preset="animalSheepLoot" />
    </type>
    <type name="Animal_GallusGallusDomesticus">
        <cargo preset="animalChickenLoot" />
    </type>
    <type name="Animal_LepusEuropaeus">
        <cargo preset="animalHareLoot" />
    </type>
</spawnabletypes>
`;

const serverDzCfg = `hostname = "DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]";
password = "";
passwordAdmin = "";
maxPlayers = 32;
verifySignatures = 2;
forceSameBuild = 1;
disableVoN = 0;
vonCodecQuality = 20;
disable3rdPerson = 0;
disableCrosshair = 0;
disablePersonalLight = 0;
lightingConfig = 0;
serverTime = "SystemTime";
serverTimeAcceleration = 6;
serverNightTimeAcceleration = 4;
serverTimePersistent = 0;
guaranteedUpdates = 1;
loginQueueConcurrentPlayers = 5;
loginQueueMaxPlayers = 500;
instanceId = 1;
storageAutoFix = 1;
respawnTime = 0;
motd[] = {"Bem-vindo ao servidor DayZ!", "Divirta-se com loot x2 e eventos ativos!"};
motdInterval = 60;
class Missions
{
    class DayZ
    {
        template = "dayzOffline.chernarusplus";
    };
};
`;

export const DEMO_FILES: Record<string, string> = {
  "serverDZ.cfg": serverDzCfg,
  "db/types.xml": typesXml,
  "db/events.xml": eventsXml,
  "db/globals.xml": globalsXml,
  "cfggameplay.json": gameplayJson,
  "cfgrandompresets.xml": cfgrandompresetsXml,
  "cfgspawnabletypes.xml": cfgspawnabletypesXml,
};
