import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";
import { ITEMS, ITEM_LABELS, getItemLabel } from "@/lib/demo-data";
import {
  FileCode,
  Copy,
  Sparkles,
  SlidersHorizontal,
  Plus,
  RotateCcw,
  PackageCheck,
  Beef,
  Skull,
  ShieldAlert,
} from "lucide-react";

export type CreatureDropItem = {
  name: string;
  count: number; // Quantidade de unidades deste item que caem ao morrer (ex: 1x, 2x, 4x)
  chance: string;
  quantmin: string;
  quantmax: string;
};

export type CreatureGroup = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  type: "zombie" | "animal";
  items: CreatureDropItem[];
};

const ZOMBIE_GROUPS: Omit<CreatureGroup, "items">[] = [
  {
    id: "zombieSoldier",
    title: "Zumbis Militares",
    subtitle: "Bases militares, aeroportos, postos de guarda",
    icon: "🪖",
    type: "zombie",
  },
  {
    id: "zombiePolice",
    title: "Zumbis Policiais",
    subtitle: "Delegacias, bloqueios de estrada, blitzes",
    icon: "👮",
    type: "zombie",
  },
  {
    id: "zombieMedic",
    title: "Zumbis Médicos & Enfermeiros",
    subtitle: "Hospitais, postos de saúde, ambulâncias",
    icon: "🏥",
    type: "zombie",
  },
  {
    id: "zombieFirefighter",
    title: "Zumbis Bombeiros",
    subtitle: "Corpo de bombeiros, acidentes na pista",
    icon: "🚒",
    type: "zombie",
  },
  {
    id: "zombieIndustrial",
    title: "Zumbis Industriais",
    subtitle: "Fábricas, canteiros de obra, portos",
    icon: "🏭",
    type: "zombie",
  },
  {
    id: "zombieCivilian",
    title: "Zumbis Civis",
    subtitle: "Cidades, bairros residenciais, mercados",
    icon: "🏘️",
    type: "zombie",
  },
  {
    id: "zombieVillager",
    title: "Zumbis Rurais / Aldeões",
    subtitle: "Vilas do interior, fazendas, plantações",
    icon: "🌾",
    type: "zombie",
  },
  {
    id: "zombieHunter",
    title: "Zumbis Caçadores",
    subtitle: "Cabanas na floresta, acampamentos de caça",
    icon: "🌲",
    type: "zombie",
  },
  {
    id: "zombieNBC",
    title: "Zumbis NBC (Zona Contaminada)",
    subtitle: "Zonas de gás tóxico químico (Pavlovo / Rify)",
    icon: "☣️",
    type: "zombie",
  },
  {
    id: "zombiePrisoner",
    title: "Zumbis Prisioneiros",
    subtitle: "Presídios, prisões e celas",
    icon: "⛓️",
    type: "zombie",
  },
];

const ANIMAL_GROUPS: Omit<CreatureGroup, "items">[] = [
  {
    id: "animalBearLoot",
    title: "Urso Pardo (Bear)",
    subtitle: "Predador alfa das florestas do norte",
    icon: "🐻",
    type: "animal",
  },
  {
    id: "animalWolfLoot",
    title: "Lobo da Floresta (Wolf)",
    subtitle: "Matilhas agressivas nas matas profundas",
    icon: "🐺",
    type: "animal",
  },
  {
    id: "animalDeerLoot",
    title: "Cervo / Veado (Deer)",
    subtitle: "Cervos e corças rápidos nas planícies",
    icon: "🦌",
    type: "animal",
  },
  {
    id: "animalBoarLoot",
    title: "Javali Selvagem (Wild Boar)",
    subtitle: "Javalis agressivos perto de carvalhos",
    icon: "🐗",
    type: "animal",
  },
  {
    id: "animalCowLoot",
    title: "Vaca / Touro (Cow)",
    subtitle: "Bovinos em pastos e currais rurais",
    icon: "🐄",
    type: "animal",
  },
  {
    id: "animalPigLoot",
    title: "Porco Doméstico (Pig)",
    subtitle: "Suínos em fazendas e celeiros",
    icon: "🐖",
    type: "animal",
  },
  {
    id: "animalGoatLoot",
    title: "Cabra Montês (Goat)",
    subtitle: "Caprinos em morros rochosos e encostas",
    icon: "🐐",
    type: "animal",
  },
  {
    id: "animalSheepLoot",
    title: "Ovelha / Carneiro (Sheep)",
    subtitle: "Ovinos em colinas e pastagens",
    icon: "🐑",
    type: "animal",
  },
  {
    id: "animalChickenLoot",
    title: "Galinha / Galo (Chicken)",
    subtitle: "Aves domésticas em quintais de vilarejos",
    icon: "🐔",
    type: "animal",
  },
  {
    id: "animalFoxLoot",
    title: "Raposa (Fox)",
    subtitle: "Pequenos canídeos ágeis dos bosques",
    icon: "🦊",
    type: "animal",
  },
  {
    id: "animalHareLoot",
    title: "Lebre / Coelho (Hare)",
    subtitle: "Pequenos animais de caça nas moitas",
    icon: "🐇",
    type: "animal",
  },
];

function parsePresetsXml(xml: string): Record<string, CreatureDropItem[]> {
  const result: Record<string, CreatureDropItem[]> = {};
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const parseGroupItems = (parentEl: Element): CreatureDropItem[] => {
      const items: CreatureDropItem[] = [];
      Array.from(parentEl.getElementsByTagName("item")).forEach((i) => {
        const name = i.getAttribute("name");
        if (!name) return;
        const chance = i.getAttribute("chance") ?? "1.00";
        const quantmin = i.getAttribute("quantmin") ?? "-1";
        const quantmax = i.getAttribute("quantmax") ?? "-1";

        const existing = items.find(
          (it) =>
            it.name === name &&
            it.chance === chance &&
            it.quantmin === quantmin &&
            it.quantmax === quantmax,
        );
        if (existing) {
          existing.count = (existing.count || 1) + 1;
        } else {
          items.push({
            name,
            count: 1,
            chance,
            quantmin,
            quantmax,
          });
        }
      });
      return items;
    };

    // LootPresets (Zombies)
    Array.from(doc.getElementsByTagName("lootPresets")).forEach((lp) => {
      const name = lp.getAttribute("name");
      if (!name) return;
      result[name] = parseGroupItems(lp);
    });

    // Cargo presets (Animals / Custom)
    Array.from(doc.getElementsByTagName("cargo")).forEach((cg) => {
      const name = cg.getAttribute("name");
      if (!name) return;
      result[name] = parseGroupItems(cg);
    });
  } catch (e) {
    console.error("Erro ao analisar cfgrandompresets.xml:", e);
  }
  return result;
}

function serializePresetsXml(
  existingXml: string,
  zombieState: Record<string, CreatureDropItem[]>,
  animalState: Record<string, CreatureDropItem[]>,
): string {
  const doc = new DOMParser().parseFromString(
    existingXml || "<randompresets></randompresets>",
    "text/xml",
  );
  const root = doc.documentElement;

  // Remover nós antigos que vamos substituir
  const allManagedIds = new Set([...Object.keys(zombieState), ...Object.keys(animalState)]);
  const toRemove: Element[] = [];

  Array.from(root.children).forEach((child) => {
    const name = child.getAttribute("name");
    if (name && allManagedIds.has(name)) {
      toRemove.push(child);
    }
  });
  toRemove.forEach((el) => root.removeChild(el));

  // Manter outros presets não gerenciados (se houver)
  const serializer = new XMLSerializer();
  let retainedXml = "";
  Array.from(root.children).forEach((child) => {
    retainedXml += "\t" + serializer.serializeToString(child) + "\n";
  });

  // Gerar blocos de zumbis (<lootPresets>)
  let zombieXml = "";
  Object.entries(zombieState).forEach(([presetName, items]) => {
    zombieXml += `\t<lootPresets name="${presetName}">\n`;
    items.forEach((it) => {
      const count = Math.max(1, Math.min(50, it.count || 1));
      const qmin = it.quantmin && it.quantmin !== "-1" ? ` quantmin="${it.quantmin}"` : "";
      const qmax = it.quantmax && it.quantmax !== "-1" ? ` quantmax="${it.quantmax}"` : "";
      for (let c = 0; c < count; c++) {
        zombieXml += `\t\t<item name="${it.name}" chance="${it.chance || "1.00"}"${qmin}${qmax} />\n`;
      }
    });
    zombieXml += `\t</lootPresets>\n`;
  });

  // Gerar blocos de animais (<cargo>)
  let animalXml = "";
  Object.entries(animalState).forEach(([presetName, items]) => {
    animalXml += `\t<cargo chance="1.0" name="${presetName}">\n`;
    items.forEach((it) => {
      const count = Math.max(1, Math.min(50, it.count || 1));
      const qmin = it.quantmin && it.quantmin !== "-1" ? ` quantmin="${it.quantmin}"` : "";
      const qmax = it.quantmax && it.quantmax !== "-1" ? ` quantmax="${it.quantmax}"` : "";
      for (let c = 0; c < count; c++) {
        animalXml += `\t\t<item name="${it.name}" chance="${it.chance || "1.00"}"${qmin}${qmax} />\n`;
      }
    });
    animalXml += `\t</cargo>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n<randompresets>\n${zombieXml}${animalXml}${retainedXml}</randompresets>\n`;
}

export function CreatureLootEditor({ s }: { s: Session }) {
  const path = missionFile(s, "cfgrandompresets.xml");
  const f = useRemoteFile(s, path);

  const [activeTab, setActiveTab] = useState<"zombies" | "animals">("zombies");
  const [dirty, setDirty] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>("zombieSoldier");

  const [zombieData, setZombieData] = useState<Record<string, CreatureDropItem[]>>({});
  const [animalData, setAnimalData] = useState<Record<string, CreatureDropItem[]>>({});
  const [baseXml, setBaseXml] = useState("");

  // Modal de adição de item
  const [pickerTargetGroup, setPickerTargetGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => {
    if (f.text) {
      const parsed = parsePresetsXml(f.text);
      setBaseXml(f.text);

      const zMap: Record<string, CreatureDropItem[]> = {};
      ZOMBIE_GROUPS.forEach((g) => {
        zMap[g.id] = parsed[g.id] ?? [];
      });
      setZombieData(zMap);

      const aMap: Record<string, CreatureDropItem[]> = {};
      ANIMAL_GROUPS.forEach((g) => {
        aMap[g.id] = parsed[g.id] ?? [];
      });
      setAnimalData(aMap);

      setDirty(false);
    }
  }, [f.text]);

  const setAllCountsInGroup = (groupId: string, isAnimal: boolean, count: number) => {
    const patcher = (prev: Record<string, CreatureDropItem[]>) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).map((it) => ({ ...it, count })),
    });
    if (isAnimal) setAnimalData(patcher);
    else setZombieData(patcher);
    setDirty(true);
    toast.success(`Quantidade de cada item definida para ${count}x unidades!`);
  };

  const copyPresetXml = (groupId: string, isAnimal: boolean) => {
    const items = (isAnimal ? animalData[groupId] : zombieData[groupId]) ?? [];
    let xml = isAnimal
      ? `<!-- cfgrandompresets.xml - Cargo de Animais -->\n<cargo chance="1.0" name="${groupId}">\n`
      : `<!-- cfgrandompresets.xml - Loot de Zumbis -->\n<lootPresets name="${groupId}">\n`;
    items.forEach((it) => {
      const count = Math.max(1, it.count || 1);
      const qmin = it.quantmin && it.quantmin !== "-1" ? ` quantmin="${it.quantmin}"` : "";
      const qmax = it.quantmax && it.quantmax !== "-1" ? ` quantmax="${it.quantmax}"` : "";
      for (let c = 0; c < count; c++) {
        xml += `    <item name="${it.name}" chance="${it.chance || "1.00"}"${qmin}${qmax} />\n`;
      }
    });
    xml += isAnimal ? `</cargo>` : `</lootPresets>`;
    navigator.clipboard.writeText(xml);
    toast.success(`Tag XML de ${groupId} copiada para a área de transferência!`);
  };

  const updateItem = (
    groupId: string,
    isAnimal: boolean,
    itemIndex: number,
    patch: Partial<CreatureDropItem>,
  ) => {
    if (isAnimal) {
      setAnimalData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((it, idx) =>
          idx === itemIndex ? { ...it, ...patch } : it,
        ),
      }));
    } else {
      setZombieData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((it, idx) =>
          idx === itemIndex ? { ...it, ...patch } : it,
        ),
      }));
    }
    setDirty(true);
  };

  const removeItem = (groupId: string, isAnimal: boolean, itemIndex: number) => {
    if (isAnimal) {
      setAnimalData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).filter((_, idx) => idx !== itemIndex),
      }));
    } else {
      setZombieData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).filter((_, idx) => idx !== itemIndex),
      }));
    }
    setDirty(true);
  };

  const addItemToGroup = (itemName: string) => {
    if (!pickerTargetGroup) return;
    const isAnimal = ANIMAL_GROUPS.some((g) => g.id === pickerTargetGroup);
    const newItem: CreatureDropItem = {
      name: itemName,
      count: 1,
      chance: "1.00",
      quantmin: "100",
      quantmax: "100",
    };

    const updater = (prev: Record<string, CreatureDropItem[]>) => {
      const currentList = prev[pickerTargetGroup] ?? [];
      const existingIdx = currentList.findIndex((i) => i.name === itemName);
      if (existingIdx >= 0) {
        const updated = [...currentList];
        updated[existingIdx] = {
          ...updated[existingIdx],
          count: (updated[existingIdx].count || 1) + 1,
        };
        return { ...prev, [pickerTargetGroup]: updated };
      }
      return { ...prev, [pickerTargetGroup]: [...currentList, newItem] };
    };

    if (isAnimal) setAnimalData(updater);
    else setZombieData(updater);

    setDirty(true);
    setPickerTargetGroup(null);
    toast.success(
      `Item "${ITEM_LABELS[itemName] ?? itemName}" adicionado com quantidade configurável!`,
    );
  };

  const setAllChancesInGroup = (groupId: string, isAnimal: boolean, chance: string) => {
    if (isAnimal) {
      setAnimalData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((it) => ({ ...it, chance })),
      }));
    } else {
      setZombieData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((it) => ({ ...it, chance })),
      }));
    }
    setDirty(true);
    toast.success(`Todas as chances ajustadas para ${Number(chance) * 100}%!`);
  };

  const setAllDurabilityInGroup = (
    groupId: string,
    isAnimal: boolean,
    qmin: string,
    qmax: string,
  ) => {
    if (isAnimal) {
      setAnimalData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((it) => ({ ...it, quantmin: qmin, quantmax: qmax })),
      }));
    } else {
      setZombieData((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((it) => ({ ...it, quantmin: qmin, quantmax: qmax })),
      }));
    }
    setDirty(true);
    toast.success(`Durabilidade dos itens do grupo atualizada!`);
  };

  const save = async () => {
    try {
      const xml = serializePresetsXml(baseXml, zombieData, animalData);
      await f.save(xml);
      setBaseXml(xml);
      setDirty(false);
      toast.success(
        "Tabela de drops de Zumbis e Animais salva com sucesso no cfgrandompresets.xml!",
      );
    } catch (e) {
      toast.error(`Erro ao salvar: ${(e as Error).message}`);
    }
  };

  const catalogFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ITEMS.filter(([name, , cat]) => {
      const label = (ITEM_LABELS[name] ?? getItemLabel(name)).toLowerCase();
      const matchQ = !q || name.toLowerCase().includes(q) || label.includes(q);
      const matchCat = !filterCat || cat === filterCat;
      return matchQ && matchCat;
    });
  }, [search, filterCat]);

  if (!f.text)
    return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  const currentGroups = activeTab === "zombies" ? ZOMBIE_GROUPS : ANIMAL_GROUPS;
  const currentData = activeTab === "zombies" ? zombieData : animalData;

  return (
    <div className="space-y-6">
      {/* Banner de Cabeçalho */}
      <div className="panel space-y-2 p-5 bg-gradient-to-r from-card via-card to-primary/10 border-primary/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-primary font-display flex items-center gap-2">
              <span>🧟</span> Loot de Animais e Zumbis (Drop Tables)
            </h2>
            <p className="text-sm text-foreground/90 max-w-2xl">
              Escolha exatamente o que vai cair dos <strong>zumbis</strong> ao eliminá-los e dos{" "}
              <strong>animais selvagens</strong> ao abatê-los e limpá-los. Defina a{" "}
              <strong>chance de queda</strong> (de 1% a 100%) e a{" "}
              <strong>durabilidade/quantidade</strong> de cada item!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary shadow-lg shadow-primary/20"
              disabled={!dirty || f.saving}
              onClick={save}
            >
              {f.saving
                ? "Salvando no Servidor…"
                : dirty
                  ? "💾 Salvar Drops de Animais & Zumbis"
                  : "Salvo no Servidor"}
            </button>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground flex flex-wrap gap-4 border-t border-border/40">
          <span>
            📁 Arquivo: <strong>cfgrandompresets.xml</strong> (lootPresets & cargo)
          </span>
          <span>
            🎯 Dica: Chance 1.00 = 100% (cai sempre), 0.50 = 50% das vezes, 0.10 = 10% (raro)
          </span>
        </div>
      </div>

      {/* Switcher de Subabas: Zumbis vs Animais */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => {
            setActiveTab("zombies");
            setOpenGroup("zombieSoldier");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 font-display text-lg tracking-wider border-b-2 transition-colors ${
            activeTab === "zombies"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🧟</span> Zumbis (Infectados) ({ZOMBIE_GROUPS.length} Grupos)
        </button>

        <button
          onClick={() => {
            setActiveTab("animals");
            setOpenGroup("animalBearLoot");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 font-display text-lg tracking-wider border-b-2 transition-colors ${
            activeTab === "animals"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🐺</span> Animais Selvagens & Caça ({ANIMAL_GROUPS.length} Espécies)
        </button>
      </div>

      {/* Lista de Criaturas (Accordion Rico) */}
      <div className="space-y-3">
        {currentGroups.map((group) => {
          const items = currentData[group.id] ?? [];
          const isOpen = openGroup === group.id;
          const isAnimal = group.type === "animal";

          return (
            <div
              key={group.id}
              className={`panel transition-colors border ${
                isOpen
                  ? "border-primary/50 bg-card shadow-md"
                  : "border-border bg-card/60 hover:border-border/80"
              }`}
            >
              {/* Header do Accordion */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer select-none"
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div>
                    <h3 className="text-lg font-display text-primary flex items-center gap-2">
                      {group.title}
                      <span className="text-xs font-mono text-muted-foreground font-normal">
                        ({group.id})
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary border border-border text-foreground font-mono">
                    {items.length} {items.length === 1 ? "item" : "itens"} (
                    {items.reduce((s, it) => s + (it.count || 1), 0)} un. no drop)
                  </span>
                  <span className="text-primary text-lg font-bold">{isOpen ? "▾" : "▸"}</span>
                </div>
              </div>

              {/* Conteúdo do Grupo Expandido */}
              {isOpen && (
                <div className="p-4 pt-1 border-t border-border space-y-4">
                  {/* Barra de Ações Rápidas do Grupo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-secondary/40 border border-border/50 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-muted-foreground font-semibold">Qtd de cada item:</span>
                      <button
                        className="btn-ghost h-6 px-2 text-[11px] text-foreground hover:bg-secondary"
                        onClick={() => setAllCountsInGroup(group.id, isAnimal, 1)}
                      >
                        1x em Todos
                      </button>
                      <button
                        className="btn-ghost h-6 px-2 text-[11px] text-blue-400 hover:bg-blue-400/10"
                        onClick={() => setAllCountsInGroup(group.id, isAnimal, 2)}
                      >
                        2x em Todos
                      </button>
                      {isAnimal ? (
                        <button
                          className="btn-ghost h-6 px-2 text-[11px] text-amber-400 hover:bg-amber-400/10"
                          onClick={() => setAllCountsInGroup(group.id, isAnimal, 4)}
                        >
                          🥩 Carnes x4
                        </button>
                      ) : (
                        <button
                          className="btn-ghost h-6 px-2 text-[11px] text-amber-400 hover:bg-amber-400/10"
                          onClick={() => setAllCountsInGroup(group.id, isAnimal, 3)}
                        >
                          🪖 Drops x3
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-muted-foreground font-semibold">Chances:</span>
                      <button
                        className="btn-ghost h-6 px-2 text-[11px]"
                        onClick={() => setAllChancesInGroup(group.id, isAnimal, "1.00")}
                      >
                        100% Sempre
                      </button>
                      <button
                        className="btn-ghost h-6 px-2 text-[11px]"
                        onClick={() => setAllChancesInGroup(group.id, isAnimal, "0.50")}
                      >
                        50% Metade
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-muted-foreground font-semibold">Pilha:</span>
                      <button
                        className="btn-ghost h-6 px-2 text-[11px] text-green-400"
                        onClick={() => setAllDurabilityInGroup(group.id, isAnimal, "100", "100")}
                      >
                        🟢 100% Cheia
                      </button>
                      <button
                        className="btn-ghost h-6 px-2 text-[11px] text-yellow-400"
                        onClick={() => setAllDurabilityInGroup(group.id, isAnimal, "50", "80")}
                      >
                        🟡 50-80% Média
                      </button>
                    </div>

                    <button
                      className="btn-ghost h-6 px-2 text-[11px] text-primary border border-primary/30 hover:bg-primary/10 ml-auto"
                      onClick={() => copyPresetXml(group.id, isAnimal)}
                      title="Copiar snippet XML deste grupo para cfgrandompresets.xml"
                    >
                      📋 Copiar XML do Grupo
                    </button>
                  </div>

                  {/* Tabela de Itens que Caem */}
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-md">
                      Nenhum item configurado para cair desta criatura.
                      <div className="mt-2">
                        <button
                          className="btn-primary text-xs"
                          onClick={() => {
                            setPickerTargetGroup(group.id);
                            setSearch("");
                          }}
                        >
                          + Adicionar Primeiro Item
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_150px_120px_150px_32px] gap-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>Item que Cai</span>
                        <span title="Quantidade de unidades deste item que caem ao morrer">
                          Qtd a Dropar (Unidades) ⓘ
                        </span>
                        <span title="Chance de 0 a 100% deste item cair">Chance de Drop ⓘ</span>
                        <span title="Tamanho da pilha ou durabilidade de cada unidade">
                          Pilha / Condição ⓘ
                        </span>
                        <span />
                      </div>

                      {items.map((it, idx) => {
                        const label = ITEM_LABELS[it.name] ?? it.name;
                        const chanceNum = Math.round(Number(it.chance || "1") * 100);

                        return (
                          <div
                            key={`${it.name}-${idx}`}
                            className="grid grid-cols-[1fr_150px_120px_150px_32px] items-center gap-2 p-2 rounded-sm border border-border bg-background/50 hover:border-primary/40 transition-colors"
                          >
                            {/* Nome do Item */}
                            <div className="min-w-0 pr-2">
                              <div
                                className="font-semibold text-xs text-foreground truncate"
                                title={label}
                              >
                                {label}
                              </div>
                              <div
                                className="font-mono text-[10px] text-muted-foreground truncate"
                                title={it.name}
                              >
                                {it.name}
                              </div>
                            </div>

                            {/* Quantidade deste item específico a dropar */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="btn-ghost h-6 w-6 p-0 text-xs font-bold bg-secondary/80 hover:bg-primary/20 text-foreground"
                                  onClick={() =>
                                    updateItem(group.id, isAnimal, idx, {
                                      count: Math.max(1, (it.count || 1) - 1),
                                    })
                                  }
                                  title="Diminuir quantidade de unidades"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={it.count || 1}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      1,
                                      Math.min(50, parseInt(e.target.value) || 1),
                                    );
                                    updateItem(group.id, isAnimal, idx, { count: val });
                                  }}
                                  className="field h-6 w-12 text-center font-mono font-bold text-xs p-0 text-primary bg-background"
                                  title="Quantidade de unidades deste item a dropar"
                                />
                                <button
                                  type="button"
                                  className="btn-ghost h-6 w-6 p-0 text-xs font-bold bg-secondary/80 hover:bg-primary/20 text-foreground"
                                  onClick={() =>
                                    updateItem(group.id, isAnimal, idx, {
                                      count: Math.min(50, (it.count || 1) + 1),
                                    })
                                  }
                                  title="Aumentar quantidade de unidades"
                                >
                                  +
                                </button>
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                {[1, 2, 4].map((cnt) => (
                                  <button
                                    key={cnt}
                                    type="button"
                                    onClick={() =>
                                      updateItem(group.id, isAnimal, idx, { count: cnt })
                                    }
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-colors ${
                                      (it.count || 1) === cnt
                                        ? "bg-primary text-primary-foreground font-bold"
                                        : "bg-secondary text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    {cnt}x
                                  </button>
                                ))}
                                <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                                  {it.count || 1} un.
                                </span>
                              </div>
                            </div>

                            {/* Chance de Drop com Barra Visual */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-primary font-bold">{chanceNum}%</span>
                                <input
                                  className="cell w-12 text-right p-0 h-5"
                                  value={it.chance}
                                  onChange={(e) =>
                                    updateItem(group.id, isAnimal, idx, { chance: e.target.value })
                                  }
                                />
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={Number(it.chance) || 0}
                                onChange={(e) =>
                                  updateItem(group.id, isAnimal, idx, { chance: e.target.value })
                                }
                                className="w-full h-1 accent-primary cursor-pointer"
                              />
                            </div>

                            {/* Quantidade / Pilha / Durabilidade */}
                            <div className="space-y-1">
                              <select
                                className="field w-full text-[11px] h-7 cursor-pointer"
                                value={
                                  it.quantmin === "100" && it.quantmax === "100"
                                    ? "100"
                                    : it.quantmin === "75"
                                      ? "75"
                                      : it.quantmin === "50"
                                        ? "50"
                                        : it.quantmin === "20"
                                          ? "20"
                                          : "-1"
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "100")
                                    updateItem(group.id, isAnimal, idx, {
                                      quantmin: "100",
                                      quantmax: "100",
                                    });
                                  else if (v === "75")
                                    updateItem(group.id, isAnimal, idx, {
                                      quantmin: "75",
                                      quantmax: "100",
                                    });
                                  else if (v === "50")
                                    updateItem(group.id, isAnimal, idx, {
                                      quantmin: "50",
                                      quantmax: "80",
                                    });
                                  else if (v === "20")
                                    updateItem(group.id, isAnimal, idx, {
                                      quantmin: "20",
                                      quantmax: "40",
                                    });
                                  else
                                    updateItem(group.id, isAnimal, idx, {
                                      quantmin: "-1",
                                      quantmax: "-1",
                                    });
                                }}
                              >
                                <option value="100">🟢 100% Pilha / Pristine</option>
                                <option value="75">📦 75-100% Quase Cheia</option>
                                <option value="50">🟡 50-80% Média / Desgastado</option>
                                <option value="20">🔴 20-40% Pouca / Danificado</option>
                                <option value="-1">⚪ Padrão DayZ (-1)</option>
                              </select>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                <span>
                                  quant: {it.quantmin ?? "-1"} a {it.quantmax ?? "-1"}
                                </span>
                              </div>
                            </div>

                            {/* Botão Remover */}
                            <button
                              className="text-destructive hover:bg-destructive/15 h-7 w-7 rounded-sm flex items-center justify-center text-sm"
                              title="Remover item deste drop"
                              onClick={() => removeItem(group.id, isAnimal, idx)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Botão Adicionar Item */}
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => {
                        setPickerTargetGroup(group.id);
                        setSearch("");
                      }}
                    >
                      + Adicionar Item para cair de {group.title}
                    </button>

                    <span className="text-[11px] text-muted-foreground">
                      Total: {items.length} itens configurados
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal / Dialog para Escolher Item do Catálogo DayZ */}
      {pickerTargetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="panel w-full max-w-2xl max-h-[85vh] flex flex-col p-5 space-y-4 shadow-2xl border-primary/40">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-display text-primary">Escolher Item para o Drop</h3>
                <p className="text-xs text-muted-foreground">
                  Adicionando drop para: <strong>{pickerTargetGroup}</strong>
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground text-lg px-2"
                onClick={() => setPickerTargetGroup(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                className="field flex-1"
                placeholder="Buscar item DayZ (ex: carne, pele, faca, munição, comida, remédio...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <select
                className="field"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="">Todas as Categorias</option>
                <option value="weapons">Armas & Munições</option>
                <option value="food">Comidas, Carnes & Bebidas</option>
                <option value="tools">Peles, Ferramentas & Medicina</option>
                <option value="clothes">Roupas & Mochilas</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[50vh]">
              {catalogFiltered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum item encontrado para "{search}".
                </div>
              ) : (
                catalogFiltered.map(([name, , cat]) => {
                  const label = ITEM_LABELS[name] ?? name;
                  return (
                    <button
                      key={name}
                      onClick={() => addItemToGroup(name)}
                      className="w-full flex items-center justify-between p-2 rounded-sm text-left hover:bg-secondary/70 border border-transparent hover:border-border transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs text-foreground group-hover:text-primary truncate">
                          {label}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {name} · <span className="uppercase text-[9px]">{cat}</span>
                        </div>
                      </div>
                      <span className="btn-ghost h-6 text-[10px] px-2 py-0 shrink-0">
                        Adicionar Drop +
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Exibindo {catalogFiltered.length} itens do catálogo DayZ
              </span>
              <button className="btn-ghost" onClick={() => setPickerTargetGroup(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
