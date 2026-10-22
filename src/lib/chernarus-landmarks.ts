export type BuildingCategory =
  | "Hospital"
  | "Polícia"
  | "Bombeiros"
  | "Castelo"
  | "Torre/Radar"
  | "Industrial"
  | "Hangar/Aéreo"
  | "Marco Costeiro";

export interface NotableBuilding {
  id: string;
  name: string;
  shortName: string;
  category: BuildingCategory;
  city: string;
  x: number;
  z: number;
  description: string;
  lootProfile: string;
  hasRooftop: boolean;
  featured?: boolean;
}

export type RoadType = "Rodovia Principal" | "Estrada Secundária" | "Linha Férrea (Trem)";

export interface RoadRoute {
  id: string;
  name: string;
  shortName: string;
  type: RoadType;
  surface: "Asfalto" | "Terra Batida / Cascalho" | "Trilhos de Trem";
  color: string;
  dangerLevel: "Alto (Emboscadas & Tráfego)" | "Médio" | "Baixo";
  destinations: string;
  description: string;
  points: [number, number][]; // Coordenadas [X, Z] de 0 a 15360
}

export const NOTABLE_BUILDINGS: NotableBuilding[] = [
  // HOSPITAIS E CENTROS MÉDICOS
  {
    id: "hosp-cherno",
    name: "Hospital Central de Chernogorsk",
    shortName: "Hospital Cherno",
    category: "Hospital",
    city: "Chernogorsk",
    x: 6450,
    z: 2600,
    description:
      "Grande hospital de 3 andares com heliponto na cobertura. Principal ponto de suprimentos médicos do sudoeste.",
    lootProfile: "Bolsas de Sangue, IV Kits, Morfina, Antibióticos, Soro e Trajes Médicos",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "hosp-elektro",
    name: "Hospital Geral de Elektrozavodsk",
    shortName: "Hospital Elektro",
    category: "Hospital",
    city: "Elektrozavodsk",
    x: 10450,
    z: 2350,
    description:
      "Hospital central de Elektrozavodsk. Área de intenso PvP entre jogadores recém-nascidos na costa sul.",
    lootProfile: "Tetrachiclina, Bandagens Cirúrgicas, Solução Salina e Epinefrina",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "hosp-berezino",
    name: "Hospital Regional de Berezino",
    shortName: "Hospital Berezino",
    category: "Hospital",
    city: "Berezino",
    x: 11950,
    z: 9100,
    description:
      "Grande complexo hospitalar da costa leste. Vital para quem renasce perto de Solnichniy e Berezino.",
    lootProfile: "Kits de Primeiros Socorros, Analgésicos, Codeína e Carvão Ativado",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "hosp-novo",
    name: "Hospital Metropolitano de Novodmitrovsk",
    shortName: "Hospital Novo",
    category: "Hospital",
    city: "Novodmitrovsk",
    x: 11400,
    z: 14500,
    description:
      "O maior hospital da região norte de Chernarus. Múltiplos consultórios e depósito de ambulâncias.",
    lootProfile: "Todo tipo de remédio avançado, desfibriladores e kits cirúrgicos",
    hasRooftop: true,
  },
  {
    id: "hosp-severo",
    name: "Centro Clínico de Severograd",
    shortName: "Clínica Severo",
    category: "Hospital",
    city: "Severograd",
    x: 7900,
    z: 12650,
    description:
      "Posto médico e hospitalar que atende a ferrovia e o vale industrial de Severograd.",
    lootProfile: "Morfina, Seringas, Vitaminas e Kits de Curativo",
    hasRooftop: false,
  },
  {
    id: "hosp-zeleno",
    name: "Clínica Médica de Zelenogorsk",
    shortName: "Clínica Zeleno",
    category: "Hospital",
    city: "Zelenogorsk",
    x: 2750,
    z: 5400,
    description:
      "Clínica médica estratégica em Zelenogorsk, perto da estação de trem e dos quartéis militares.",
    lootProfile: "Kits de transfusão rápida, ataduras estéreis e bolsas de sangue",
    hasRooftop: false,
  },
  {
    id: "hosp-svetlo",
    name: "Hospital Portuário de Svetloyarsk",
    shortName: "Hospital Svetlo",
    category: "Hospital",
    city: "Svetloyarsk",
    x: 13950,
    z: 13300,
    description:
      "Hospital litorâneo do extremo nordeste. Ponto chave de cura antes de seguir para Tisy.",
    lootProfile: "Medicamentos anti-infecciosos e pastilhas de cloro para purificar água",
    hasRooftop: true,
  },

  // DELEGACIAS DE POLÍCIA
  {
    id: "pol-cherno",
    name: "Delegacia de Polícia de Chernogorsk",
    shortName: "Polícia Cherno",
    category: "Polícia",
    city: "Chernogorsk",
    x: 6650,
    z: 2550,
    description:
      "Edifício de dois andares com celas e armários balísticos. Excelente para obter pistolas e coletes leves.",
    lootProfile: "Pistolas CR-75, IJ-70, Escopetas BK-133, Coldres e Coletes Policiais",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "pol-elektro",
    name: "Delegacia de Polícia de Elektrozavodsk",
    shortName: "Polícia Elektro",
    category: "Polícia",
    city: "Elektrozavodsk",
    x: 10550,
    z: 2300,
    description:
      "Prédio policial icônico ao lado da igreja de Elektro. Muito visado por atiradores das colinas.",
    lootProfile: "Makarov, Kolt 1911, Algemas, Granadas de Luz e Cacetetes",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "pol-berezino",
    name: "Delegacia de Polícia de Berezino",
    shortName: "Polícia Berezino",
    category: "Polícia",
    city: "Berezino",
    x: 12050,
    z: 9050,
    description: "Delegacia central na avenida principal de Berezino, com sala de custódia.",
    lootProfile: "Escopetas Pump-Action, SG5-K, Munição 9mm e .45 ACP",
    hasRooftop: true,
  },
  {
    id: "pol-zeleno",
    name: "Delegacia de Polícia de Zelenogorsk",
    shortName: "Polícia Zeleno",
    category: "Polícia",
    city: "Zelenogorsk",
    x: 2720,
    z: 5320,
    description: "Posto policial na rota principal do sudoeste rumo à base militar de Zelenogorsk.",
    lootProfile: "Colete de Polícia, Submetralhadoras e Lanternas Táticas",
    hasRooftop: true,
  },
  {
    id: "pol-vybor",
    name: "Delegacia de Polícia de Vybor",
    shortName: "Polícia Vybor",
    category: "Polícia",
    city: "Vybor",
    x: 3820,
    z: 8920,
    description:
      "Delegacia localizada a minutos do Aeroporto Noroeste (NWAF). Ponto de parada rápido.",
    lootProfile: "Rádios portáteis, cartuchos de escopeta e pistolas automáticas",
    hasRooftop: false,
  },
  {
    id: "pol-severo",
    name: "Comissariado de Polícia de Severograd",
    shortName: "Polícia Severo",
    category: "Polícia",
    city: "Severograd",
    x: 7750,
    z: 12600,
    description: "Grande comissariado policial servindo todo o corredor ferroviário do norte.",
    lootProfile: "Pistolas FX-45, Deagle, Carregadores Estendidos e Megafone",
    hasRooftop: true,
  },
  {
    id: "pol-novo",
    name: "QG Central de Polícia de Novodmitrovsk",
    shortName: "QG Polícia Novo",
    category: "Polícia",
    city: "Novodmitrovsk",
    x: 11500,
    z: 14450,
    description: "Maior delegacia urbana de Chernarus, com salas de arquivo e arsenais blindados.",
    lootProfile: "Capacetes Policiais balísticos, Escopetas e Fardas Pretas",
    hasRooftop: true,
  },
  {
    id: "pol-gorka",
    name: "Posto Policial de Gorka",
    shortName: "Polícia Gorka",
    category: "Polícia",
    city: "Gorka",
    x: 9520,
    z: 8850,
    description: "Posto policial encravado nas montanhas do centro-leste.",
    lootProfile: "Pistolas 9mm e cartucheiras de caça",
    hasRooftop: false,
  },

  // CORPO DE BOMBEIROS
  {
    id: "fire-cherno",
    name: "Quartel de Bombeiros de Chernogorsk",
    shortName: "Bombeiros Cherno",
    category: "Bombeiros",
    city: "Chernogorsk",
    x: 6400,
    z: 2450,
    description:
      "Quartel com torre de observação e hangares de caminhão de bombeiro. Posição elevada para observar a praça.",
    lootProfile: "Machados de Incêndio, Roupas Resistentes ao Fogo, Kits de Respirador",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "fire-elektro",
    name: "Estação de Bombeiros de Elektrozavodsk",
    shortName: "Bombeiros Elektro",
    category: "Bombeiros",
    city: "Elektrozavodsk",
    x: 10350,
    z: 2200,
    description: "Estação com alta torre de secagem de mangueiras. Ponto clássico de sniper.",
    lootProfile: "Machados pesados, jaquetas térmicas de bombeiro e sinalizadores",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "fire-nwaf",
    name: "Estação de Bombeiros do NWAF (Aeroporto)",
    shortName: "Bombeiros NWAF",
    category: "Bombeiros",
    city: "NWAF",
    x: 4700,
    z: 10100,
    description:
      "Bombeiros militares situados na pista sul do Aeroporto Noroeste. Foco constante de combate armado.",
    lootProfile: "Equipamento militar mesclado com ferramental de resgate e trajes anti-chama",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "fire-zeleno",
    name: "Estação de Bombeiros de Zelenogorsk",
    shortName: "Bombeiros Zeleno",
    category: "Bombeiros",
    city: "Zelenogorsk",
    x: 2650,
    z: 5200,
    description: "Posto dos bombeiros junto aos trilhos do trem e galpões industriais.",
    lootProfile: "Machadinhas, cordas de escalada e sinalizadores náuticos",
    hasRooftop: true,
  },

  // CASTELOS E FORTALEZAS HISTÓRICAS
  {
    id: "castle-zub",
    name: "Castelo de Zub (Castelo do Dente)",
    shortName: "Castelo Zub",
    category: "Castelo",
    city: "Vyshnoye",
    x: 6500,
    z: 5600,
    description:
      "Antiga fortaleza medieval no topo de um morro isolado. Visão panorâmica de 360° de todo o vale central.",
    lootProfile: "Espadas medievais, Bestas, Flechas, Mochilas de Caça e Roupas Camufladas",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "castle-rog",
    name: "Castelo Rog (Ruínas do Chifre)",
    shortName: "Castelo Rog",
    category: "Castelo",
    city: "Msta",
    x: 11250,
    z: 4300,
    description:
      "Ruínas de torre de pedra acima da floresta de Msta. Excelente esconderijo de bases e tendas.",
    lootProfile: "Capacetes medievais de ferro, arcos e suprimentos rústicos de sobrevivência",
    hasRooftop: true,
  },
  {
    id: "castle-devil",
    name: "Castelo do Diabo (Devil's Castle)",
    shortName: "Devil's Castle",
    category: "Castelo",
    city: "Grishino / Gvozdno",
    x: 6900,
    z: 11450,
    description:
      "A mais imponente fortaleza medieval de Chernarus. Muralhas altas e múltiplas torres defensivas no norte.",
    lootProfile: "Armas de caça antigas, baionetas, kits de acampamento e mochilas de couro",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "castle-krona",
    name: "Castelo Krona (Black Mountain)",
    shortName: "Castelo Krona",
    category: "Castelo",
    city: "Krasnostav",
    x: 10300,
    z: 12100,
    description: "Castelo situado no cume da Montanha Negra. Vigia todo o vale de Krasnostav.",
    lootProfile: "Rifles Mosin-Nagant, miras telescópicas de caça e munição 7.62x54mm",
    hasRooftop: true,
  },

  // TORRES DE RÁDIO E RADAR
  {
    id: "radio-green-mtn",
    name: "Torre de Transmissão de Green Mountain",
    shortName: "Green Mountain",
    category: "Torre/Radar",
    city: "Green Mountain",
    x: 3700,
    z: 6000,
    description:
      "A mais alta torre de rádio e comunicação de Chernarus. Sede tradicional de traders e estações de transmissão.",
    lootProfile: "Rádios transmissores de longa distância, baterias de 9V, binóculos e miras",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "radio-altar",
    name: "Complexo de Rádio e Antenas de Altar",
    shortName: "Antenas Altar",
    category: "Torre/Radar",
    city: "Gorka / Stary Sobor",
    x: 8150,
    z: 9100,
    description:
      "Montanha com quatro mastros gigantescos de rádio militar e estações de retransmissão no centro do mapa.",
    lootProfile: "Receptores de GPS, kits de fiação, baterias de carro e geradores elétricos",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "radio-cherno-tv",
    name: "Torre de TV e Antenas de Chernogorsk",
    shortName: "Torre TV Cherno",
    category: "Torre/Radar",
    city: "Chernogorsk",
    x: 6200,
    z: 2950,
    description: "Antena localizada nas colinas imediatamente ao norte dos subúrbios de Cherno.",
    lootProfile: "Equipamento eletrônico e miras de visão a laser",
    hasRooftop: true,
  },

  // COMPLEXOS INDUSTRIAIS E USINAS
  {
    id: "ind-elektro-tec",
    name: "Usina Termelétrica de Elektrozavodsk (TEC)",
    shortName: "Usina TEC Elektro",
    category: "Industrial",
    city: "Elektrozavodsk",
    x: 10600,
    z: 2150,
    description:
      "Gigantesco complexo industrial com duas chaminés gêmeas visíveis por quilômetros na costa.",
    lootProfile: "Peças de veículos, velas de ignição, baterias de caminhão e ferramentas pesadas",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "ind-cherno-docks",
    name: "Doca e Porto Industrial de Cherno",
    shortName: "Porto Cherno",
    category: "Industrial",
    city: "Chernogorsk",
    x: 6700,
    z: 2250,
    description:
      "Pátio de contêineres e guindastes portuários à beira-mar. Ponto abundante de ferramentas de construção de base.",
    lootProfile: "Picaretas, Pás, Pregos, Tábuas, Arame Farpado e Alicates",
    hasRooftop: true,
  },
  {
    id: "ind-solnichniy",
    name: "Fábrica de Cimento de Solnichniy",
    shortName: "Fábrica Solnichniy",
    category: "Industrial",
    city: "Solnichniy",
    x: 13350,
    z: 6300,
    description: "Silos de cimento e esteiras industriais na pedreira de Solnichniy.",
    lootProfile: "Chapas de metal, latas de óleo para motor e kits de reparo de ferramentas",
    hasRooftop: true,
  },
  {
    id: "ind-novaya-sawmill",
    name: "Grande Serraria de Novaya Petrovka",
    shortName: "Serraria Petrovka",
    category: "Industrial",
    city: "Novaya Petrovka",
    x: 3450,
    z: 13100,
    description: "A maior madeireira e depósito florestal do norte de Chernarus.",
    lootProfile: "Troncos, Motosserras, Pregos para construção de base e machados de corte",
    hasRooftop: false,
  },

  // HANGARES E AVIAÇÃO
  {
    id: "hangar-nwaf-main",
    name: "Fileira de Hangares do NWAF",
    shortName: "Hangares NWAF",
    category: "Hangar/Aéreo",
    city: "NWAF",
    x: 4500,
    z: 9600,
    description:
      "Cinco hangares aeronáuticos fortificados alinhados na borda da pista principal de pouso do NWAF.",
    lootProfile: "Fuzis M4A1, DMR, Caixas de Munição 5.56x45, Capacetes e Peças de Aeronave",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "atc-balota",
    name: "Torre de Controle de Voo de Balota",
    shortName: "Torre Balota",
    category: "Hangar/Aéreo",
    city: "Balota",
    x: 5000,
    z: 2450,
    description: "Antiga torre de controle de tráfego aéreo na pista litorânea de Balota.",
    lootProfile: "Miras ópticas, fardas de aviador e coletes táticos leves",
    hasRooftop: true,
  },
  {
    id: "hangar-neaf",
    name: "Hangar de Carga de Krasnostav (NEAF)",
    shortName: "Hangar NEAF",
    category: "Hangar/Aéreo",
    city: "Krasnostav",
    x: 12100,
    z: 12600,
    description: "Hangar de manutenção de aeronaves de carga no aeródromo do nordeste.",
    lootProfile: "Peças de veículos, barris de armazenamento e roupas militares",
    hasRooftop: false,
  },

  // MARCOS COSTEIROS E FARÓIS
  {
    id: "sea-rify-ship",
    name: "Navio Cargueiro Naufragado de Rify",
    shortName: "Navio Rify",
    category: "Marco Costeiro",
    city: "Berezino Norte",
    x: 14100,
    z: 11200,
    description:
      "Navio comercial encalhado e quebrado ao meio nas pedras da costa. Zona de contaminação por gás permanente.",
    lootProfile: "Loot militar exclusivo Tier 4 / NBC: M4A1, LAR, Silenciadores e C4",
    hasRooftop: true,
    featured: true,
  },
  {
    id: "sea-farol-otmel",
    name: "Farol da Ilha de Ferro (Otmel)",
    shortName: "Farol Otmel",
    category: "Marco Costeiro",
    city: "Chernogorsk Leste",
    x: 8000,
    z: 1600,
    description: "Farol histórico localizado na ilha de Otmel ao sul de Prigorodki.",
    lootProfile: "Sinalizadores náuticos, botas de borracha e binóculos",
    hasRooftop: true,
  },
  {
    id: "sea-farol-golova",
    name: "Farol do Cabo Golova",
    shortName: "Farol Cabo Golova",
    category: "Marco Costeiro",
    city: "Elektrozavodsk Sul",
    x: 12000,
    z: 1800,
    description: "Farol no ponto mais ao sul da costa oriental de Chernarus.",
    lootProfile: "Lanternas marinhas, linhas de pesca e facas de mergulho",
    hasRooftop: true,
  },
];

export const CHERNARUS_ROADS: RoadRoute[] = [
  {
    id: "m04-coastal-highway",
    name: "Rodovia Costeira M04 (Sul-Leste)",
    shortName: "M04 Costeira",
    type: "Rodovia Principal",
    surface: "Asfalto",
    color: "#f59e0b", // Âmbar dourado
    dangerLevel: "Alto (Emboscadas & Tráfego)",
    destinations: "Kamenka → Cherno → Elektro → Berezino → Svetlojarsk",
    description:
      "A mais movimentada estrada de Chernarus. Conecta todas as cidades da costa sul e oriental onde a maioria dos sobreviventes inicia a jornada.",
    points: [
      [1800, 2200], // Kamenka
      [3600, 2400], // Komarovo
      [4400, 2400], // Balota
      [5300, 2400], // Novy Dvor / Cherno Outskirts
      [6500, 2400], // Chernogorsk Centro
      [7800, 3100], // Prigorodki
      [10500, 2300], // Elektrozavodsk
      [12100, 3500], // Kamyshovo
      [13400, 6200], // Solnichniy
      [13000, 7700], // Nizhnoye
      [12000, 9100], // Berezino
      [12200, 10800], // Khelm
      [13900, 13200], // Svetloyarsk
    ],
  },
  {
    id: "central-north-south-highway",
    name: "Rodovia Central Norte-Sul",
    shortName: "Central Norte-Sul",
    type: "Rodovia Principal",
    surface: "Asfalto",
    color: "#38bdf8", // Azul celeste
    dangerLevel: "Alto (Emboscadas & Tráfego)",
    destinations: "Chernogorsk → Stary Sobor → Kabanino → Grishino → Severograd",
    description:
      "A principal rota de asfalto que corta o coração de Chernarus do mar até as montanhas e fábricas do norte.",
    points: [
      [6600, 2700], // Cherno Norte
      [5800, 4600], // Nadezhdino
      [6200, 6400], // Pogorevka junction
      [7100, 7700], // Novy Sobor
      [6000, 7700], // Stary Sobor
      [5300, 8600], // Kabanino
      [5900, 10300], // Grishino
      [7800, 12700], // Severograd
    ],
  },
  {
    id: "western-express-highway",
    name: "Rodovia Oeste (Costa ao Aeroporto NWAF)",
    shortName: "Rodovia Oeste",
    type: "Rodovia Principal",
    surface: "Asfalto",
    color: "#a855f7", // Roxo
    dangerLevel: "Alto (Emboscadas & Tráfego)",
    destinations: "Balota → Kozlovka → Zelenogorsk → Pustoshka → Vybor → NWAF",
    description:
      "Rota preferida por grupos motorizados para transportar equipamentos de Zelenogorsk diretamente para Vybor e o NWAF.",
    points: [
      [4400, 2600], // Balota Norte
      [4400, 4600], // Kozlovka
      [2700, 5300], // Zelenogorsk
      [4400, 6400], // Pogorevka
      [3000, 7800], // Pustoshka
      [3800, 8900], // Vybor
      [4500, 9600], // NWAF Sul
      [2800, 10000], // Lopatino
      [1700, 13900], // Tisy
    ],
  },
  {
    id: "northern-transversal-highway",
    name: "Rodovia Transversal do Norte",
    shortName: "Transversal Norte",
    type: "Rodovia Principal",
    surface: "Asfalto",
    color: "#ec4899", // Rosa
    dangerLevel: "Médio",
    destinations: "Sinystok → Novaya Petrovka → Severograd → Novodmitrovsk",
    description:
      "Grande artéria asfáltica que conecta as cidades do extremo norte de leste a oeste sem precisar passar pelo interior selvagem.",
    points: [
      [1500, 12000], // Sinystok
      [3400, 13000], // Novaya Petrovka
      [6200, 12700], // Ratnoe
      [7800, 12700], // Severograd
      [8600, 11900], // Gvozdno
      [9500, 13800], // Svergino
      [11400, 14400], // Novodmitrovsk
    ],
  },
  {
    id: "eastern-mountain-route",
    name: "Estrada das Serras do Leste",
    shortName: "Serras do Leste",
    type: "Estrada Secundária",
    surface: "Terra Batida / Cascalho",
    color: "#84cc16", // Verde limão
    dangerLevel: "Médio",
    destinations: "Elektro → Staroye → Dolina → Polana → Gorka → Krasnostav",
    description:
      "Estrada sinuosa de terra e cascalho que margeia florestas densas. Muito usada para se deslocar furtivamente longe do asfalto.",
    points: [
      [10400, 2600], // Elektro Norte
      [10100, 5500], // Staroye
      [11200, 6600], // Dolina
      [10700, 8100], // Polana
      [9500, 8800], // Gorka
      [10400, 9800], // Dubrovka
      [11200, 12200], // Krasnostav
      [13900, 13200], // Svetloyarsk
    ],
  },
  {
    id: "railroad-main-line",
    name: "Linha Férrea Principal de Chernarus (Trilhos de Trem)",
    shortName: "Ferrovia Nacional",
    type: "Linha Férrea (Trem)",
    surface: "Trilhos de Trem",
    color: "#e2e8f0", // Prata / Branco tracejado
    dangerLevel: "Médio",
    destinations: "Kamenka → Cherno → Elektro → Solnichniy → Berezino → Novodmitrovsk",
    description:
      "Rede de trilhos de trem com estações e vagões abandonados. Excelente linha de navegação a pé sem se perder no mapa.",
    points: [
      [1800, 2100], // Kamenka Estação
      [3600, 2350], // Komarovo Trilhos
      [4500, 2300], // Balota Pista
      [6700, 2200], // Cherno Docks / Pátio de Manobras
      [10600, 2100], // Elektro Usina TEC
      [12100, 3400], // Kamyshovo
      [13400, 6100], // Solnichniy Fábrica
      [12400, 9300], // Berezino Docks
      [12300, 10900], // Khelm
      [14000, 13100], // Svetlojarsk Porto
      [11600, 14200], // Novodmitrovsk Industrial
      [7700, 12500], // Severograd Estação Central
      [3400, 12900], // Novaya Petrovka Fim da Linha
    ],
  },
];
