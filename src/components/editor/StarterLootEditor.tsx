import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";
import { ITEMS, ITEM_LABELS, getItemLabel } from "@/lib/demo-data";

export type StarterItem = {
  id: string;
  name: string;
  slot: "attachment" | "cargo";
  chance: string;
  quantmin: string;
  quantmax: string;
};

const DEFAULT_ATTACHMENTS = ["TShirt_Green", "Jeans_Blue", "Sneakers_Black"];
const DEFAULT_CARGO = [
  { name: "Plum", chance: "1.00", quantmin: "-1", quantmax: "-1" },
  { name: "BandageDressing", chance: "1.00", quantmin: "100", quantmax: "100" },
  { name: "Chemlight_White", chance: "1.00", quantmin: "-1", quantmax: "-1" },
  { name: "Matchbox", chance: "1.00", quantmin: "100", quantmax: "100" },
];

function parseXml(xml: string): { items: StarterItem[]; fullXml: string } {
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const types = Array.from(doc.getElementsByTagName("type"));
    const survivor = types.find((t) => {
      const n = t.getAttribute("name")?.toLowerCase() ?? "";
      return n === "survivorbase" || n === "survivormale_base" || n === "survivorfemale_base";
    });

    if (!survivor) {
      return {
        items: [
          ...DEFAULT_ATTACHMENTS.map((name, i) => ({
            id: `att-${i}-${name}`,
            name,
            slot: "attachment" as const,
            chance: "1.00",
            quantmin: "-1",
            quantmax: "-1",
          })),
          ...DEFAULT_CARGO.map((c, i) => ({
            id: `cargo-${i}-${c.name}`,
            name: c.name,
            slot: "cargo" as const,
            chance: c.chance,
            quantmin: c.quantmin,
            quantmax: c.quantmax,
          })),
        ],
        fullXml: xml,
      };
    }

    const items: StarterItem[] = [];
    const attachmentsNode = survivor.getElementsByTagName("attachments")[0];
    if (attachmentsNode) {
      Array.from(attachmentsNode.getElementsByTagName("item")).forEach((item, idx) => {
        items.push({
          id: `att-${idx}-${item.getAttribute("name")}`,
          name: item.getAttribute("name") ?? "",
          slot: "attachment",
          chance: item.getAttribute("chance") ?? "1.00",
          quantmin: item.getAttribute("quantmin") ?? "-1",
          quantmax: item.getAttribute("quantmax") ?? "-1",
        });
      });
    }

    const cargoNode = survivor.getElementsByTagName("cargo")[0];
    if (cargoNode) {
      Array.from(cargoNode.getElementsByTagName("item")).forEach((item, idx) => {
        items.push({
          id: `cargo-${idx}-${item.getAttribute("name")}`,
          name: item.getAttribute("name") ?? "",
          slot: "cargo",
          chance: item.getAttribute("chance") ?? "1.00",
          quantmin: item.getAttribute("quantmin") ?? "-1",
          quantmax: item.getAttribute("quantmax") ?? "-1",
        });
      });
    }

    return { items, fullXml: xml };
  } catch (err) {
    console.error("Erro ao analisar cfgspawnabletypes.xml:", err);
    return { items: [], fullXml: xml };
  }
}

function serializeXml(baseXml: string, items: StarterItem[]): string {
  const attachments = items.filter((x) => x.slot === "attachment");
  const cargo = items.filter((x) => x.slot === "cargo");

  const buildSurvivorType = (typeName: string) => {
    let out = `\t<type name="${typeName}">\n`;
    if (attachments.length) {
      out += `\t\t<attachments chance="1.00">\n`;
      attachments.forEach((a) => {
        const qmin = a.quantmin && a.quantmin !== "-1" ? ` quantmin="${a.quantmin}"` : "";
        const qmax = a.quantmax && a.quantmax !== "-1" ? ` quantmax="${a.quantmax}"` : "";
        out += `\t\t\t<item name="${a.name}" chance="${a.chance || "1.00"}"${qmin}${qmax} />\n`;
      });
      out += `\t\t</attachments>\n`;
    }
    if (cargo.length) {
      out += `\t\t<cargo chance="1.00">\n`;
      cargo.forEach((c) => {
        const qmin = c.quantmin && c.quantmin !== "-1" ? ` quantmin="${c.quantmin}"` : "";
        const qmax = c.quantmax && c.quantmax !== "-1" ? ` quantmax="${c.quantmax}"` : "";
        out += `\t\t\t<item name="${c.name}" chance="${c.chance || "1.00"}"${qmin}${qmax} />\n`;
      });
      out += `\t\t</cargo>\n`;
    }
    out += `\t</type>\n`;
    return out;
  };

  const doc = new DOMParser().parseFromString(
    baseXml || "<spawnabletypes></spawnabletypes>",
    "text/xml",
  );
  const root = doc.documentElement;

  // Remover sobreviventes antigos se existirem
  const toRemove: Element[] = [];
  Array.from(root.children).forEach((child) => {
    const n = child.getAttribute("name")?.toLowerCase() ?? "";
    if (n === "survivorbase" || n === "survivormale_base" || n === "survivorfemale_base") {
      toRemove.push(child);
    }
  });
  toRemove.forEach((el) => root.removeChild(el));

  // Serializar os outros tipos mantendo-os intactos
  const serializer = new XMLSerializer();
  let otherXml = "";
  Array.from(root.children).forEach((child) => {
    otherXml += "\t" + serializer.serializeToString(child) + "\n";
  });

  const survivorBlocks =
    buildSurvivorType("SurvivorBase") +
    buildSurvivorType("SurvivorMale_Base") +
    buildSurvivorType("SurvivorFemale_Base");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n<spawnabletypes>\n${survivorBlocks}${otherXml}</spawnabletypes>\n`;
}

const PRESETS = [
  {
    name: "Sobrevivência Padrão (Vanilla)",
    desc: "Camiseta, calça jeans, tênis, 1 fruta, 1 curativo, fósforo e glowstick",
    items: [
      {
        id: "p1",
        name: "TShirt_Green",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "p2",
        name: "Jeans_Blue",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "p3",
        name: "Sneakers_Black",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "p4",
        name: "Plum",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "p5",
        name: "BandageDressing",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "p6",
        name: "Matchbox",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "p7",
        name: "Chemlight_White",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
    ],
  },
  {
    name: "PvP Rápido (Com Pistola e Colete)",
    desc: "Mochila de assalto, colete policial, IJ-70 + pente, munição 9mm, faca de combate e comida",
    items: [
      {
        id: "pvp1",
        name: "TacticalShirt_Olive",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "pvp2",
        name: "CargoPants_Black",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "pvp3",
        name: "MilitaryBoots_Black",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "pvp4",
        name: "BallisticVest",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp5",
        name: "AssaultBag_Green",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp6",
        name: "IJ70",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp7",
        name: "Mag_IJ70_8Rnd",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp8",
        name: "Ammo_9x19",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp9",
        name: "CombatKnife",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp10",
        name: "BandageDressing",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp11",
        name: "TacticalBaconCan",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "pvp12",
        name: "Canteen",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
    ],
  },
  {
    name: "Caçador & Aventureiro",
    desc: "Mochila de caça, jaqueta quente, faca de caça, cantil, bússola e fósforos",
    items: [
      {
        id: "c1",
        name: "QuiltedJacket_Black",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "c2",
        name: "HunterPants_Autumn",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "c3",
        name: "HikingBoots_Brown",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "-1",
        quantmax: "-1",
      },
      {
        id: "c4",
        name: "HuntingBag",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "c5",
        name: "HuntingKnife",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "c6",
        name: "Canteen",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "c7",
        name: "Compass",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "c8",
        name: "Matchbox",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "c9",
        name: "BakedBeansCan",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
      {
        id: "c10",
        name: "BandageDressing",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "100",
        quantmax: "100",
      },
    ],
  },
  {
    name: "Hardcore Severo (Dificuldade Extrema)",
    desc: "Apenas 1 trapo usado e tênis velhos. Sem comida nem ferramentas.",
    items: [
      {
        id: "h1",
        name: "TShirt_Green",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "30",
        quantmax: "50",
      },
      {
        id: "h2",
        name: "Jeans_Blue",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "30",
        quantmax: "50",
      },
      {
        id: "h3",
        name: "Sneakers_Black",
        slot: "attachment" as const,
        chance: "1.00",
        quantmin: "20",
        quantmax: "40",
      },
      {
        id: "h4",
        name: "Rag",
        slot: "cargo" as const,
        chance: "1.00",
        quantmin: "50",
        quantmax: "50",
      },
    ],
  },
];

export function StarterLootEditor({ s }: { s: Session }) {
  const path = missionFile(s, "cfgspawnabletypes.xml");
  const f = useRemoteFile(s, path);
  const [items, setItems] = useState<StarterItem[]>([]);
  const [baseXml, setBaseXml] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<"attachment" | "cargo">("cargo");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => {
    if (f.text) {
      const parsed = parseXml(f.text);
      setItems(parsed.items);
      setBaseXml(parsed.fullXml);
      setDirty(false);
    }
  }, [f.text]);

  const updateItem = (id: string, patch: Partial<StarterItem>) => {
    setItems((curr) => curr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  const removeItem = (id: string) => {
    setItems((curr) => curr.filter((it) => it.id !== id));
    setDirty(true);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setItems(
      preset.items.map((it) => ({ ...it, id: `${it.slot}-${Date.now()}-${Math.random()}` })),
    );
    setDirty(true);
    toast.success(`Preset "${preset.name}" aplicado! Não se esqueça de salvar.`);
  };

  const addItemFromCatalog = (itemName: string) => {
    const newItem: StarterItem = {
      id: `${pickerSlot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: itemName,
      slot: pickerSlot,
      chance: "1.00",
      quantmin: "100",
      quantmax: "100",
    };
    setItems((curr) => [...curr, newItem]);
    setDirty(true);
    setPickerOpen(false);
    toast.success(`Item "${ITEM_LABELS[itemName] ?? itemName}" adicionado ao kit inicial!`);
  };

  const save = async () => {
    try {
      const newXml = serializeXml(baseXml, items);
      await f.save(newXml);
      setBaseXml(newXml);
      setDirty(false);
      toast.success("Loot inicial (Survivor Loadout) salvo com sucesso no cfgspawnabletypes.xml!");
    } catch (e) {
      toast.error(`Erro ao salvar: ${(e as Error).message}`);
    }
  };

  const attachments = useMemo(() => items.filter((x) => x.slot === "attachment"), [items]);
  const cargo = useMemo(() => items.filter((x) => x.slot === "cargo"), [items]);

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

  return (
    <div className="space-y-6">
      {/* Banner explicativo */}
      <div className="panel space-y-2 p-5 bg-gradient-to-r from-card via-card to-primary/10 border-primary/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-primary font-display flex items-center gap-2">
              <span>🎒</span> Loot Inicial do Jogador (Spawn Loadout)
            </h2>
            <p className="text-sm text-foreground/90 max-w-2xl">
              Configure com o que cada pessoa começa no servidor ao renascer na praia ou no mapa.
              Você pode definir <strong>vestuário equipado</strong>,{" "}
              <strong>itens e armas no inventário</strong> e a{" "}
              <strong>durabilidade/integridade</strong> inicial de cada item.
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
                  ? "💾 Salvar Kit Inicial"
                  : "Salvo no Servidor"}
            </button>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground flex flex-wrap gap-4 border-t border-border/40">
          <span>
            📁 Arquivo: <strong>cfgspawnabletypes.xml</strong> (SurvivorBase)
          </span>
          <span>⚡ Aplicação: Imediata para novos personagens que nascerem após reiniciar</span>
        </div>
      </div>

      {/* Seletor de Presets Rápidos */}
      <div className="panel p-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          ⚡ Presets Prontos de Início
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col justify-between p-3 rounded-md border border-border bg-background/50 hover:border-primary/50 transition-colors"
            >
              <div>
                <h4 className="font-semibold text-sm text-primary">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.desc}</p>
              </div>
              <button
                className="btn-ghost mt-3 text-xs w-full justify-center hover:bg-primary/20 hover:text-primary"
                onClick={() => applyPreset(p)}
              >
                Usar Este Kit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Duas colunas: Roupas equipadas vs Inventário/Mochila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Vestuário Equipado (Attachments) */}
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-lg font-display text-primary flex items-center gap-2">
                <span>👕</span> Roupas & Equipamentos Equipados
              </h3>
              <p className="text-xs text-muted-foreground">
                Itens já vestidos no personagem (anexos do corpo)
              </p>
            </div>
            <button
              className="btn-ghost text-xs h-7"
              onClick={() => {
                setPickerSlot("attachment");
                setPickerOpen(true);
              }}
            >
              + Adicionar Roupa
            </button>
          </div>

          {attachments.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Nenhuma roupa configurada. O jogador começará pelado!
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onUpdate={(patch) => updateItem(it.id, patch)}
                  onRemove={() => removeItem(it.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Coluna 2: Itens no Inventário (Cargo) */}
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-lg font-display text-primary flex items-center gap-2">
                <span>🎒</span> Itens no Inventário / Bolsos
              </h3>
              <p className="text-xs text-muted-foreground">
                Comida, água, remédios, ferramentas e armas nos bolsos/mochila
              </p>
            </div>
            <button
              className="btn-ghost text-xs h-7"
              onClick={() => {
                setPickerSlot("cargo");
                setPickerOpen(true);
              }}
            >
              + Adicionar Item
            </button>
          </div>

          {cargo.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Nenhum item inicial no inventário.
            </div>
          ) : (
            <div className="space-y-2">
              {cargo.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onUpdate={(patch) => updateItem(it.id, patch)}
                  onRemove={() => removeItem(it.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Dialog para Adicionar Item */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="panel w-full max-w-2xl max-h-[85vh] flex flex-col p-5 space-y-4 shadow-2xl border-primary/40">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-display text-primary">Adicionar Item ao Kit Inicial</h3>
                <p className="text-xs text-muted-foreground">
                  Adicionando como:{" "}
                  <strong>
                    {pickerSlot === "attachment"
                      ? "👕 Roupa / Equipado no corpo"
                      : "🎒 Item no inventário (Cargo)"}
                  </strong>
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground text-lg px-2"
                onClick={() => setPickerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                className="field flex-1"
                placeholder="Buscar por nome ou classe (ex: faca, mochila, M4A1, bandagem, comida, água...)"
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
                <option value="clothes">Roupas & Mochilas</option>
                <option value="food">Comidas & Bebidas</option>
                <option value="tools">Ferramentas & Medicina</option>
                <option value="containers">Recipientes & Tendas</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[50vh]">
              {catalogFiltered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum item encontrado com "{search}".
                </div>
              ) : (
                catalogFiltered.map(([name, , cat]) => {
                  const label = ITEM_LABELS[name] ?? name;
                  return (
                    <button
                      key={name}
                      onClick={() => addItemFromCatalog(name)}
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
                        Adicionar +
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
              <button className="btn-ghost" onClick={() => setPickerOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: StarterItem;
  onUpdate: (patch: Partial<StarterItem>) => void;
  onRemove: () => void;
}) {
  const label = ITEM_LABELS[item.name] ?? item.name;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-sm border border-border bg-background/60 hover:border-border/80">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-xs truncate" title={label}>
          {label}
        </div>
        <div className="font-mono text-[10px] text-muted-foreground truncate" title={item.name}>
          {item.name}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Durabilidade / Carga Inicial */}
        <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-sm">
          <span
            className="text-[10px] text-muted-foreground"
            title="Integridade / Carga em porcentagem (-1 = padrão 100%)"
          >
            Durabilidade:
          </span>
          <select
            className="bg-transparent font-mono text-[11px] outline-none text-primary cursor-pointer"
            value={
              item.quantmin === "100" && item.quantmax === "100"
                ? "100"
                : item.quantmin === "50"
                  ? "50"
                  : item.quantmin === "20"
                    ? "20"
                    : "-1"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "100") onUpdate({ quantmin: "100", quantmax: "100" });
              else if (v === "50") onUpdate({ quantmin: "50", quantmax: "80" });
              else if (v === "20") onUpdate({ quantmin: "20", quantmax: "40" });
              else onUpdate({ quantmin: "-1", quantmax: "-1" });
            }}
          >
            <option value="100">🟢 100% Impecável (Nova)</option>
            <option value="50">🟡 50%-80% Desgastada</option>
            <option value="20">🔴 20%-40% Danificada</option>
            <option value="-1">⚪ Padrão DayZ</option>
          </select>
        </div>

        {/* Chance (Normalmente 100% no kit de nascimento) */}
        <div
          className="flex items-center gap-1 text-[10px] text-muted-foreground"
          title="Chance de spawn (1.0 = 100%)"
        >
          <span>Chance:</span>
          <input
            className="cell w-12 text-center"
            value={item.chance}
            onChange={(e) => onUpdate({ chance: e.target.value })}
          />
        </div>

        {/* Botão Remover */}
        <button
          className="text-destructive hover:bg-destructive/10 p-1 rounded-sm text-sm"
          title="Remover do kit"
          onClick={onRemove}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
