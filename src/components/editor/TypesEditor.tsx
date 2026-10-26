import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { missionFile, type Session } from "@/lib/nitrado";
import { weightOf } from "@/lib/weights";
import { FileState, useRemoteFile } from "./useFile";
import { StarterLootEditor } from "./StarterLootEditor";
import { ITEM_LABELS, getItemLabel } from "@/lib/demo-data";
import { Percent, SlidersHorizontal, Sparkles, RotateCcw } from "lucide-react";

type Row = {
  name: string;
  nominal: string;
  min: string;
  lifetime: string;
  restock: string;
  quantmin: string;
  quantmax: string;
  cost: string;
  category: string;
  usage: string;
  value: string;
  tag: string;
  flags: Record<string, string>;
};

const NUM = ["nominal", "min", "lifetime", "restock", "cost"] as const;
const FLAGS = [
  "count_in_cargo",
  "count_in_hoarder",
  "count_in_map",
  "count_in_player",
  "crafted",
  "deloot",
];
const FLAG_PT: Record<string, string> = {
  count_in_cargo: "Conta dentro de contêineres/veículos",
  count_in_hoarder: "Conta em esconderijos de jogadores",
  count_in_map: "Conta no chão do mapa",
  count_in_player: "Conta no inventário dos jogadores",
  crafted: "Item é fabricável",
  deloot: "Aparece em eventos dinâmicos (helicrashes etc.)",
};

function parse(xml: string): Row[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return Array.from(doc.getElementsByTagName("type")).map((t) => {
    const g = (n: string) => t.getElementsByTagName(n)[0]?.textContent ?? "";
    const attrs = (n: string) =>
      Array.from(t.getElementsByTagName(n))
        .map((e) => e.getAttribute("name"))
        .filter(Boolean)
        .join(",");
    const f = t.getElementsByTagName("flags")[0];
    const flags: Record<string, string> = {};
    FLAGS.forEach((k) => (flags[k] = f?.getAttribute(k) ?? "0"));
    return {
      name: t.getAttribute("name") ?? "",
      nominal: g("nominal"),
      min: g("min"),
      lifetime: g("lifetime"),
      restock: g("restock"),
      quantmin: g("quantmin") || "-1",
      quantmax: g("quantmax") || "-1",
      cost: g("cost"),
      category: attrs("category"),
      usage: attrs("usage"),
      value: attrs("value"),
      tag: attrs("tag"),
      flags,
    };
  });
}

function serialize(rows: Row[]) {
  const list = (tag: string, v: string) =>
    v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `\t\t<${tag} name="${x}"/>\n`)
      .join("");
  const body = rows
    .map((r) => {
      let s = `\t<type name="${r.name}">\n`;
      if (r.nominal !== "") s += `\t\t<nominal>${r.nominal}</nominal>\n`;
      if (r.lifetime !== "") s += `\t\t<lifetime>${r.lifetime}</lifetime>\n`;
      if (r.restock !== "") s += `\t\t<restock>${r.restock}</restock>\n`;
      if (r.min !== "") s += `\t\t<min>${r.min}</min>\n`;
      s += `\t\t<quantmin>${r.quantmin || "-1"}</quantmin>\n`;
      s += `\t\t<quantmax>${r.quantmax || "-1"}</quantmax>\n`;
      if (r.cost !== "") s += `\t\t<cost>${r.cost}</cost>\n`;
      s += `\t\t<flags ${FLAGS.map((k) => `${k}="${r.flags[k]}"`).join(" ")}/>\n`;
      s +=
        list("category", r.category) +
        list("usage", r.usage) +
        list("value", r.value) +
        list("tag", r.tag);
      return s + "\t</type>\n";
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n<types>\n${body}</types>\n`;
}

const PAGE = 60;
const LABEL: Record<string, string> = {
  nominal: "Quant. mapa",
  min: "Mínimo",
  lifetime: "Tempo chão (s)",
  restock: "Reposição (s)",
  cost: "Prioridade",
};
const HELP: Record<string, string> = {
  nominal: "Quantos desse item o servidor tenta manter espalhados no mapa",
  min: "Quando cair abaixo disso, o servidor volta a gerar o item",
  lifetime: "Quanto tempo o item fica no chão antes de sumir (segundos)",
  restock: "Espera (segundos) antes de repor o item",
  cost: "Prioridade de spawn (normalmente 100)",
};
const USAGES: [string, string][] = [
  ["Military", "Militar"],
  ["Police", "Polícia"],
  ["Medic", "Hospital/Médico"],
  ["Firefighter", "Bombeiros"],
  ["Industrial", "Industrial"],
  ["Farm", "Fazenda"],
  ["Coast", "Litoral"],
  ["Town", "Cidade"],
  ["Village", "Vila"],
  ["Hunting", "Caça"],
  ["Office", "Escritório"],
  ["School", "Escola"],
  ["Prison", "Prisão"],
  ["Lunapark", "Parque"],
  ["ContaminatedArea", "Zona contaminada"],
  ["Historical", "Histórico"],
];
const TIERS: [string, string][] = [
  ["Tier1", "Tier 1 · Litoral (fraco)"],
  ["Tier2", "Tier 2 · Interior"],
  ["Tier3", "Tier 3 · Norte"],
  ["Tier4", "Tier 4 · Militar forte"],
  ["Unique", "Único"],
];
const TAGS: [string, string][] = [
  ["floor", "No chão"],
  ["shelves", "Em prateleiras"],
  ["ground", "Ao ar livre"],
];
const CATS: [string, string][] = [
  ["weapons", "Armas"],
  ["clothes", "Roupas"],
  ["food", "Comida"],
  ["tools", "Ferramentas"],
  ["containers", "Recipientes"],
  ["explosives", "Explosivos"],
  ["vehiclesparts", "Peças de veículo"],
  ["lootdispatch", "Recompensas de eventos"],
];

function Chips({
  title,
  opts,
  value,
  onChange,
}: {
  title: string;
  opts: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  const cur = value.split(",").filter(Boolean);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1">
        {opts.map(([k, l]) => {
          const on = cur.includes(k);
          return (
            <button
              key={k}
              onClick={() => onChange((on ? cur.filter((x) => x !== k) : [...cur, k]).join(","))}
              className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                on
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getDurabilityBadge(qmin: string, qmax: string) {
  if (qmin === "100" && qmax === "100") {
    return {
      label: "100% Pristine",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
  }
  if (qmin === "-1" && qmax === "-1") {
    return { label: "Padrão (-1)", color: "bg-muted text-muted-foreground border-border" };
  }
  const min = Number(qmin) || 0;
  const max = Number(qmax) || 0;
  const avg = (min + max) / 2;
  if (avg >= 70) {
    return {
      label: `${min}%-${max}% Desgastado`,
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
  }
  if (avg >= 30) {
    return {
      label: `${min}%-${max}% Danificado`,
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
  }
  return {
    label: `${min}%-${max}% Muito Danificado`,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  };
}

function getDropChancePercent(r: Row): number {
  const nom = Number(r.nominal) || 0;
  const min = Number(r.min) || 0;
  const restock = Number(r.restock) || 0;

  if (nom <= 0) return 0;

  let score = nom * 2.2;
  if (restock > 3600) score *= 0.5;
  else if (restock > 1800) score *= 0.7;
  else if (restock === 0) score *= 1.25;

  if (min > 0) score += (min / nom) * 15;

  return Math.max(1, Math.min(100, Math.round(score)));
}

function getDropChanceBadge(chance: number) {
  if (chance <= 10) {
    return {
      label: "Muito Raro",
      badge: "bg-red-950/80 text-red-300 border-red-800",
      bar: "bg-red-500",
    };
  }
  if (chance <= 25) {
    return {
      label: "Raro",
      badge: "bg-orange-950/80 text-orange-300 border-orange-800",
      bar: "bg-orange-500",
    };
  }
  if (chance <= 45) {
    return {
      label: "Incomum",
      badge: "bg-amber-950/80 text-amber-300 border-amber-800",
      bar: "bg-amber-500",
    };
  }
  if (chance <= 70) {
    return {
      label: "Equilibrado",
      badge: "bg-lime-950/80 text-lime-300 border-lime-800",
      bar: "bg-lime-500",
    };
  }
  if (chance <= 90) {
    return {
      label: "Frequente",
      badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      bar: "bg-emerald-500",
    };
  }
  return {
    label: "Máximo",
    badge: "bg-sky-950/80 text-sky-300 border-sky-800",
    bar: "bg-sky-500",
  };
}

function applyDropChanceToRow(r: Row, targetChance: number): Partial<Row> {
  const clamped = Math.max(1, Math.min(100, targetChance));
  let newNominal = Math.max(1, Math.round(clamped * 0.45));
  let newMin = Math.max(1, Math.round(newNominal * 0.6));
  let newRestock = "0";

  if (clamped <= 10) {
    newNominal = Math.max(1, Math.round(clamped * 0.2));
    newMin = 1;
    newRestock = "3600";
  } else if (clamped <= 25) {
    newNominal = Math.max(2, Math.round(clamped * 0.3));
    newMin = Math.max(1, Math.round(newNominal * 0.5));
    newRestock = "1800";
  } else if (clamped <= 50) {
    newNominal = Math.max(4, Math.round(clamped * 0.4));
    newMin = Math.max(2, Math.round(newNominal * 0.6));
    newRestock = "900";
  } else if (clamped <= 75) {
    newNominal = Math.max(10, Math.round(clamped * 0.5));
    newMin = Math.max(5, Math.round(newNominal * 0.7));
    newRestock = "0";
  } else {
    newNominal = Math.max(25, Math.round(clamped * 0.7));
    newMin = Math.max(15, Math.round(newNominal * 0.8));
    newRestock = "0";
  }

  return {
    nominal: String(newNominal),
    min: String(newMin),
    restock: newRestock,
  };
}

export function TypesEditor({ s }: { s: Session }) {
  const [subTab, setSubTab] = useState<"mapLoot" | "starterLoot">("mapLoot");

  const path = missionFile(s, "db/types.xml");
  const f = useRemoteFile(s, path);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(0);
  const [mult, setMult] = useState("2");
  const [bulkDurability, setBulkDurability] = useState("100");
  const [dirty, setDirty] = useState(false);
  const [edit, setEdit] = useState<number | null>(null);

  // Estados para a funcionalidade de Chance de Drop
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [selectedItemForDrop, setSelectedItemForDrop] = useState<{
    row: Row;
    index: number;
  } | null>(null);
  const [dropChanceInput, setDropChanceInput] = useState<number>(50);
  const [bulkDropTarget, setBulkDropTarget] = useState<string>("50");

  useEffect(() => {
    if (f.text) {
      setRows(parse(f.text));
      setDirty(false);
    }
  }, [f.text]);

  const cats = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.category.split(",")).filter(Boolean))).sort(),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => {
          const query = q.toLowerCase();
          const label = (ITEM_LABELS[r.name] ?? getItemLabel(r.name)).toLowerCase();
          const matchQ = !query || r.name.toLowerCase().includes(query) || label.includes(query);
          const matchCat = !cat || r.category.split(",").includes(cat);
          return matchQ && matchCat;
        }),
    [rows, q, cat],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const upd = (i: number, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const applyBulkMultiplier = () => {
    const m = parseFloat(mult);
    if (!m) return;
    const set = new Set(filtered.map((x) => x.i));
    setRows((rs) =>
      rs.map((r, j) =>
        set.has(j)
          ? {
              ...r,
              nominal: String(Math.round(+r.nominal * m)),
              min: String(Math.round(+r.min * m)),
            }
          : r,
      ),
    );
    setDirty(true);
    toast.success(`Multiplicador ×${m} aplicado a ${filtered.length} itens!`);
  };

  const applyBulkDurability = () => {
    const set = new Set(filtered.map((x) => x.i));
    let qmin = "-1";
    let qmax = "-1";

    if (bulkDurability === "100") {
      qmin = "100";
      qmax = "100";
    } else if (bulkDurability === "75") {
      qmin = "70";
      qmax = "90";
    } else if (bulkDurability === "50") {
      qmin = "40";
      qmax = "60";
    } else if (bulkDurability === "25") {
      qmin = "15";
      qmax = "35";
    } else {
      qmin = "-1";
      qmax = "-1";
    }

    setRows((rs) =>
      rs.map((r, j) =>
        set.has(j)
          ? {
              ...r,
              quantmin: qmin,
              quantmax: qmax,
            }
          : r,
      ),
    );
    setDirty(true);
    toast.success(`Durabilidade ajustada para ${filtered.length} itens filtrados!`);
  };

  const add = () => {
    const name = prompt("Nome da classe do item (ex: AKM)");
    if (!name) return;
    setRows((rs) => [
      {
        name,
        nominal: "5",
        min: "2",
        lifetime: "14400",
        restock: "0",
        quantmin: "100",
        quantmax: "100",
        cost: "100",
        category: "",
        usage: "",
        value: "",
        tag: "",
        flags: Object.fromEntries(
          FLAGS.map((k) => [
            k,
            k === "count_in_cargo" ||
            k === "count_in_hoarder" ||
            k === "count_in_map" ||
            k === "count_in_player"
              ? "1"
              : "0",
          ]),
        ),
      },
      ...rs,
    ]);
    setQ(name);
    setDirty(true);
  };

  return (
    <div className="space-y-4">
      {/* Seletor Superior de Sub-abas na Aba Loot */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setSubTab("mapLoot")}
          className={`flex items-center gap-2 px-5 py-2.5 font-display text-lg tracking-wider border-b-2 transition-colors ${
            subTab === "mapLoot"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>📦</span> Tabela de Loot do Mapa (types.xml)
        </button>

        <button
          onClick={() => setSubTab("starterLoot")}
          className={`flex items-center gap-2 px-5 py-2.5 font-display text-lg tracking-wider border-b-2 transition-colors ${
            subTab === "starterLoot"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>🎒</span> Loot Inicial de Spawn (Kit do Jogador)
        </button>
      </div>

      {/* Se a subaba for StarterLoot, renderiza o componente de spawn inicial */}
      {subTab === "starterLoot" ? (
        <StarterLootEditor s={s} />
      ) : /* Subaba principal de Loot do Mapa (types.xml com durabilidade e filtros) */
      !f.text ? (
        <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtros e Ações em Massa */}
          <div className="panel p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="field w-64"
                placeholder="Buscar item ou classe (ex: AKM, faca, comida)…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
              />
              <select
                className="field"
                value={cat}
                onChange={(e) => {
                  setCat(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todas categorias</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <span className="text-xs text-muted-foreground">
                {filtered.length} de {rows.length} itens
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {/* Botão de Destaque: Chance de Drop de Item (%) */}
                <button
                  className="btn-primary flex items-center gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer text-xs px-3 py-1.5 transition-transform active:scale-95"
                  onClick={() => {
                    const firstItem = filtered[0] ?? (rows[0] ? { r: rows[0], i: 0 } : null);
                    if (firstItem?.r) {
                      setSelectedItemForDrop({ row: firstItem.r, index: firstItem.i });
                      setDropChanceInput(getDropChancePercent(firstItem.r));
                    }
                    setDropModalOpen(true);
                  }}
                  title="Abrir painel para alterar a % de chance de drop dos itens no mapa"
                >
                  <Percent className="size-3.5 text-emerald-200" />
                  <span>Chance de Drop de Item (%)</span>
                </button>

                <button className="btn-ghost" onClick={add}>
                  + Novo Item
                </button>
                <button
                  className="btn-primary"
                  disabled={!dirty || f.saving}
                  onClick={() => f.save(serialize(rows))}
                >
                  {f.saving ? "Salvando…" : dirty ? "💾 Salvar types.xml" : "Salvo"}
                </button>
              </div>
            </div>

            {/* Linha de Ações em Lote: Multiplicador, Durabilidade e Chance de Drop */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
              {/* Multiplicar quantidade */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold">
                  Multiplicar Qtd/Mín dos filtrados:
                </span>
                <input
                  className="field w-14 text-center"
                  value={mult}
                  onChange={(e) => setMult(e.target.value)}
                />
                <button className="btn-ghost h-7 px-2" onClick={applyBulkMultiplier}>
                  Multiplicar ×
                </button>
              </div>

              {/* Ajustar Chance de Drop dos Filtrados */}
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-sm border border-emerald-500/40">
                <span className="text-emerald-300 font-semibold flex items-center gap-1 text-xs">
                  <Percent className="size-3 text-emerald-400" />
                  Chance de Drop dos filtrados:
                </span>
                <select
                  className="field h-7 text-xs bg-background"
                  value={bulkDropTarget}
                  onChange={(e) => setBulkDropTarget(e.target.value)}
                >
                  <option value="5">🔴 5% (Muito Raro / Lendário)</option>
                  <option value="15">🟠 15% (Raro / Militar)</option>
                  <option value="35">🟡 35% (Incomum)</option>
                  <option value="50">🟢 50% (Equilibrado / Médio)</option>
                  <option value="75">🔵 75% (Comum / Frequente)</option>
                  <option value="100">🟣 100% (Drop Máximo / Todo Lugar)</option>
                </select>
                <button
                  className="btn-ghost h-7 px-2 text-emerald-300 font-bold hover:bg-emerald-500/20"
                  onClick={() => {
                    const target = Number(bulkDropTarget) || 50;
                    const set = new Set(filtered.map((x) => x.i));
                    setRows((rs) =>
                      rs.map((r, j) =>
                        set.has(j) ? { ...r, ...applyDropChanceToRow(r, target) } : r,
                      ),
                    );
                    setDirty(true);
                    toast.success(
                      `Chance de drop definida para ${target}% em ${filtered.length} itens filtrados!`,
                    );
                  }}
                >
                  Aplicar Drop %
                </button>
              </div>

              {/* Ajustar Durabilidade em Massa */}
              <div className="flex items-center gap-2 bg-secondary/40 px-3 py-1 rounded-sm border border-border/40">
                <span className="text-primary font-semibold flex items-center gap-1">
                  <span>🛡️</span> Durabilidade dos filtrados:
                </span>
                <select
                  className="field h-7 text-xs bg-background"
                  value={bulkDurability}
                  onChange={(e) => setBulkDurability(e.target.value)}
                >
                  <option value="100">🟢 100% Pristine (Novos / Sem Desgaste)</option>
                  <option value="75">🟡 70%-90% Levemente Desgastado (Worn)</option>
                  <option value="50">🟠 40%-60% Danificado (Damaged)</option>
                  <option value="25">🔴 15%-35% Muito Danificado (Badly Damaged)</option>
                  <option value="-1">⚪ Padrão Vanilla (-1)</option>
                </select>
                <button className="btn-ghost h-7 px-2 text-primary" onClick={applyBulkDurability}>
                  Aplicar Durabilidade
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="panel overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary font-display text-sm tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-2">Item & Tradução</th>
                  <th className="p-2" title="Peso de referência (fixo no Xbox)">
                    Peso
                  </th>
                  {NUM.map((k) => (
                    <th key={k} className="p-2" title={HELP[k]}>
                      {LABEL[k]} ⓘ
                    </th>
                  ))}
                  <th
                    className="p-2 text-primary bg-primary/10"
                    title="Durabilidade / Carga com que o item spawna (quantmin e quantmax em %). 100 = 100% nova, -1 = padrão vanilla"
                  >
                    🛡️ Durabilidade / Integridade ⓘ
                  </th>
                  <th
                    className="p-2 text-emerald-400 bg-emerald-500/10 whitespace-nowrap"
                    title="Estimativa e ajuste rápido da chance de drop do item (% de spawn no mapa baseada em nominal, min e restock)"
                  >
                    🎲 Chance de Drop (%) ⓘ
                  </th>
                  <th className="p-2" title="Locais e regiões onde o item aparece">
                    Onde cai ⓘ
                  </th>
                  <th
                    className="p-2"
                    title={FLAGS.map(
                      (k) =>
                        `${k.replace("count_in_", "").charAt(0).toUpperCase()} = ${FLAG_PT[k]}`,
                    ).join("\n")}
                  >
                    flags ⓘ
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {view.map(({ r, i }) => {
                  const w = weightOf(r.name);
                  const label = ITEM_LABELS[r.name] ?? getItemLabel(r.name);
                  const durBadge = getDurabilityBadge(r.quantmin, r.quantmax);

                  return (
                    <Fragment key={i}>
                      <tr className="border-t border-border hover:bg-muted/50 transition-colors">
                        <td className="min-w-56 px-2 py-1.5">
                          <div className="font-mono font-semibold text-foreground text-xs">
                            {r.name}
                          </div>
                          {label && (
                            <div
                              className="text-[11px] text-muted-foreground truncate"
                              title={label}
                            >
                              {label}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-2 font-mono text-primary">
                          {w !== undefined ? `${(w / 1000).toFixed(2)} kg` : "—"}
                        </td>

                        {NUM.map((k) => (
                          <td key={k} className="w-20 px-1">
                            <input
                              className="cell"
                              value={r[k]}
                              onChange={(e) => upd(i, { [k]: e.target.value })}
                            />
                          </td>
                        ))}

                        {/* Coluna de Durabilidade / Carga */}
                        <td className="min-w-48 px-2 py-1 bg-primary/5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono border ${durBadge.color}`}
                              title={`quantmin: ${r.quantmin}% | quantmax: ${r.quantmax}%`}
                            >
                              {durBadge.label}
                            </span>

                            <div className="flex items-center gap-0.5 text-[10px]">
                              <input
                                className="cell w-10 text-center p-0 h-5"
                                title="Durabilidade / Carga mínima (%)"
                                value={r.quantmin}
                                onChange={(e) => upd(i, { quantmin: e.target.value })}
                              />
                              <span className="text-muted-foreground">a</span>
                              <input
                                className="cell w-10 text-center p-0 h-5"
                                title="Durabilidade / Carga máxima (%)"
                                value={r.quantmax}
                                onChange={(e) => upd(i, { quantmax: e.target.value })}
                              />
                            </div>

                            <div className="flex gap-0.5 ml-auto">
                              <button
                                className="px-1 py-0.5 text-[9px] rounded-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold"
                                title="Definir 100% Pristine (Sem desgaste)"
                                onClick={() => upd(i, { quantmin: "100", quantmax: "100" })}
                              >
                                100%
                              </button>
                              <button
                                className="px-1 py-0.5 text-[9px] rounded-xs bg-secondary hover:bg-secondary/80 text-muted-foreground font-semibold"
                                title="Restaurar padrão vanilla (-1)"
                                onClick={() => upd(i, { quantmin: "-1", quantmax: "-1" })}
                              >
                                -1
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Coluna de Chance de Drop (%) */}
                        <td className="min-w-44 px-2 py-1 bg-emerald-500/5">
                          {(() => {
                            const chance = getDropChancePercent(r);
                            const badge = getDropChanceBadge(chance);
                            return (
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono border font-semibold ${badge.badge}`}
                                    title={`Chance estimada: ${chance}% de drop no mapa`}
                                  >
                                    {chance}%
                                  </span>
                                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                    {badge.label}
                                  </span>
                                </div>
                                <button
                                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold transition-colors cursor-pointer"
                                  title={`Ajustar % de chance de drop de ${r.name}`}
                                  onClick={() => {
                                    setSelectedItemForDrop({ row: r, index: i });
                                    setDropChanceInput(chance);
                                    setDropModalOpen(true);
                                  }}
                                >
                                  <SlidersHorizontal className="size-2.5" />
                                  <span>Mudar</span>
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Onde Cai */}
                        <td className="min-w-36 px-1">
                          <button
                            className="btn-ghost h-6 w-full truncate text-xs"
                            onClick={() => setEdit(edit === i ? null : i)}
                          >
                            {[r.usage, r.value].filter(Boolean).join(" · ").replace(/,/g, ", ") ||
                              "Configurar…"}
                          </button>
                        </td>

                        {/* Flags */}
                        <td className="px-1">
                          <div className="flex gap-0.5">
                            {FLAGS.map((k) => (
                              <button
                                key={k}
                                title={`${FLAG_PT[k]} — clique para ${r.flags[k] === "1" ? "desativar" : "ativar"}`}
                                onClick={() =>
                                  upd(i, {
                                    flags: { ...r.flags, [k]: r.flags[k] === "1" ? "0" : "1" },
                                  })
                                }
                                className={`h-5 w-5 rounded-sm font-mono text-[9px] ${
                                  r.flags[k] === "1"
                                    ? "bg-green-500/25 text-green-400 font-bold"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {k.replace("count_in_", "").charAt(0).toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Remover */}
                        <td className="px-1">
                          <button
                            className="text-destructive hover:bg-destructive/10 p-1 rounded-sm"
                            title="Remover item da tabela"
                            onClick={() => {
                              setRows((rs) => rs.filter((_, j) => j !== i));
                              setDirty(true);
                            }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>

                      {/* Gaveta de Edição Detalhada */}
                      {edit === i && (
                        <tr className="bg-muted/30">
                          <td
                            colSpan={NUM.length + 7}
                            className="space-y-4 p-4 border-b border-border"
                          >
                            {/* Seção Exclusiva de Durabilidade e Condição do Item */}
                            <div className="p-3 rounded-md border border-primary/30 bg-primary/5 space-y-2">
                              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                                <span>🛡️</span> Condição & Durabilidade Inicial do Item ({r.name})
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Em DayZ, <strong>quantmin</strong> e <strong>quantmax</strong>{" "}
                                controlam a integridade percentual (durabilidade) com que armas,
                                ferramentas, roupas e silenciadores nascem no chão, bem como a carga
                                de munição, água e pilhas.
                              </p>
                              <div className="flex flex-wrap items-center gap-3 pt-1">
                                <label className="flex items-center gap-1.5 text-xs">
                                  <span className="text-muted-foreground">
                                    Durabilidade Mín (%):
                                  </span>
                                  <input
                                    className="field w-16 text-center font-mono"
                                    value={r.quantmin}
                                    onChange={(e) => upd(i, { quantmin: e.target.value })}
                                  />
                                </label>

                                <label className="flex items-center gap-1.5 text-xs">
                                  <span className="text-muted-foreground">
                                    Durabilidade Máx (%):
                                  </span>
                                  <input
                                    className="field w-16 text-center font-mono"
                                    value={r.quantmax}
                                    onChange={(e) => upd(i, { quantmax: e.target.value })}
                                  />
                                </label>

                                <div className="flex flex-wrap gap-1">
                                  <button
                                    className="btn-ghost h-7 text-xs text-emerald-400"
                                    onClick={() => upd(i, { quantmin: "100", quantmax: "100" })}
                                  >
                                    🟢 100% Pristine (Sem Desgaste)
                                  </button>
                                  <button
                                    className="btn-ghost h-7 text-xs text-amber-400"
                                    onClick={() => upd(i, { quantmin: "60", quantmax: "85" })}
                                  >
                                    🟡 60%-85% Desgastado
                                  </button>
                                  <button
                                    className="btn-ghost h-7 text-xs text-orange-400"
                                    onClick={() => upd(i, { quantmin: "30", quantmax: "55" })}
                                  >
                                    🟠 30%-55% Danificado
                                  </button>
                                  <button
                                    className="btn-ghost h-7 text-xs"
                                    onClick={() => upd(i, { quantmin: "-1", quantmax: "-1" })}
                                  >
                                    ⚪ Padrão Vanilla (-1)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Seção de Chance de Drop do Item */}
                            <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                  <span>🎲</span> Chance de Drop no Mapa ({r.name})
                                </h4>
                                {(() => {
                                  const c = getDropChancePercent(r);
                                  const b = getDropChanceBadge(c);
                                  return (
                                    <span
                                      className={`px-2 py-0.5 rounded-xs text-xs font-mono border font-semibold ${b.badge}`}
                                    >
                                      {c}% · {b.label}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ajuste a probabilidade do item spawnar no mapa calculando
                                automaticamente <strong>nominal</strong> (total no mapa),{" "}
                                <strong>min</strong> (gatilho de respawn) e <strong>restock</strong>{" "}
                                (tempo de espera).
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {[
                                  { pct: 5, label: "🔴 5% Muito Raro" },
                                  { pct: 15, label: "🟠 15% Raro" },
                                  { pct: 35, label: "🟡 35% Incomum" },
                                  { pct: 50, label: "🟢 50% Equilibrado" },
                                  { pct: 75, label: "🔵 75% Frequente" },
                                  { pct: 100, label: "🟣 100% Máximo" },
                                ].map((p) => (
                                  <button
                                    key={p.pct}
                                    className="btn-ghost h-7 text-xs border border-border/50 hover:border-emerald-500/50"
                                    onClick={() => {
                                      upd(i, applyDropChanceToRow(r, p.pct));
                                      toast.success(
                                        `Chance de drop de ${r.name} alterada para ${p.pct}%!`,
                                      );
                                    }}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                                <button
                                  className="btn-primary h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white ml-auto flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    setSelectedItemForDrop({ row: r, index: i });
                                    setDropChanceInput(getDropChancePercent(r));
                                    setDropModalOpen(true);
                                  }}
                                >
                                  <SlidersHorizontal className="size-3" />
                                  <span>Ajuste Avançado (%)</span>
                                </button>
                              </div>
                            </div>

                            <Chips
                              title="Tipo de lugar onde o item aparece (também define quais zumbis o carregam)"
                              opts={USAGES}
                              value={r.usage}
                              onChange={(v) => upd(i, { usage: v })}
                            />
                            <Chips
                              title="Região do mapa (tier de raridade)"
                              opts={TIERS}
                              value={r.value}
                              onChange={(v) => upd(i, { value: v })}
                            />
                            <Chips
                              title="Posição dentro do prédio"
                              opts={TAGS}
                              value={r.tag}
                              onChange={(v) => upd(i, { tag: v })}
                            />
                            <Chips
                              title="Categoria do Item"
                              opts={CATS}
                              value={r.category}
                              onChange={(v) => upd(i, { category: v })}
                            />
                            <div className="pt-2">
                              <button
                                className="btn-ghost h-7 text-xs"
                                onClick={() => setEdit(null)}
                              >
                                Fechar Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center gap-2 text-xs">
            <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
              ‹
            </button>
            <span>
              Página {page + 1} de {pages} ({filtered.length} itens)
            </span>
            <button
              className="btn-ghost"
              disabled={page >= pages - 1}
              onClick={() => setPage(page + 1)}
            >
              ›
            </button>
            <span className="ml-4 text-muted-foreground">
              Flags: C=cargo, H=hoarder, M=map, P=player, C=crafted, D=deloot · 🛡️ Durabilidade:
              quantmin/quantmax (-1 = padrão) · 🎲 Chance de drop: 1% a 100%
            </span>
          </div>

          {/* Modal Interativo de Chance de Drop de Item */}
          {dropModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-card border border-emerald-500/40 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎲</span>
                    <div>
                      <h3 className="font-display text-base tracking-wider text-emerald-400">
                        Chance de Drop de Item (%)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Ajuste de probabilidade e frequência de spawn no mapa (types.xml)
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground text-lg px-2 cursor-pointer"
                    onClick={() => setDropModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                {/* Seleção do Item */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Item Selecionado:
                  </label>
                  {selectedItemForDrop ? (
                    <div className="p-2.5 rounded-sm bg-secondary/60 border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {selectedItemForDrop.row.name}
                        </span>
                        {ITEM_LABELS[selectedItemForDrop.row.name] && (
                          <span className="text-xs text-primary font-medium">
                            {ITEM_LABELS[selectedItemForDrop.row.name]}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[11px] text-muted-foreground font-mono">
                        <span>nominal atual: {selectedItemForDrop.row.nominal || "0"}</span>
                        <span>min atual: {selectedItemForDrop.row.min || "0"}</span>
                        <span>restock: {selectedItemForDrop.row.restock || "0"}s</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nenhum item individual selecionado. Você pode aplicar para os itens filtrados.
                    </p>
                  )}

                  {/* Seletor rápido para trocar de item sem fechar o modal */}
                  <div className="pt-1">
                    <label className="text-[11px] text-muted-foreground block mb-0.5">
                      Trocar item:
                    </label>
                    <select
                      className="field w-full text-xs"
                      value={selectedItemForDrop ? selectedItemForDrop.index : ""}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        if (!isNaN(idx) && rows[idx]) {
                          setSelectedItemForDrop({ row: rows[idx], index: idx });
                          setDropChanceInput(getDropChancePercent(rows[idx]));
                        }
                      }}
                    >
                      {filtered.slice(0, 100).map(({ r, i }) => (
                        <option key={i} value={i}>
                          {r.name} {ITEM_LABELS[r.name] ? `(${ITEM_LABELS[r.name]})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slider e Controle de Porcentagem */}
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Percent className="size-3.5 text-emerald-400" />
                      Porcentagem Desejada:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={dropChanceInput}
                        onChange={(e) =>
                          setDropChanceInput(
                            Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                          )
                        }
                        className="field w-16 text-center font-mono font-bold text-base h-8 bg-background border-emerald-500/50"
                      />
                      <span className="font-bold text-emerald-400">%</span>
                    </div>
                  </div>

                  {/* Barra de Rastreamento */}
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={dropChanceInput}
                    onChange={(e) => setDropChanceInput(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-secondary rounded-lg"
                  />

                  {/* Classificação Visual */}
                  {(() => {
                    const badge = getDropChanceBadge(dropChanceInput);
                    return (
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-xs font-semibold border ${badge.badge}`}
                        >
                          Raridade: {badge.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {dropChanceInput <= 10
                            ? "Muito difícil de achar"
                            : dropChanceInput <= 30
                              ? "Aparece com pouca frequência"
                              : dropChanceInput <= 65
                                ? "Drop equilibrado e moderado"
                                : dropChanceInput <= 85
                                  ? "Fácil de encontrar pelo mapa"
                                  : "Abundante em quase todo spawn"}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Presets Rápidos */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { pct: 5, label: "5% Muito Raro" },
                      { pct: 15, label: "15% Raro" },
                      { pct: 35, label: "35% Incomum" },
                      { pct: 50, label: "50% Equilibrado" },
                      { pct: 75, label: "75% Comum" },
                      { pct: 100, label: "100% Máximo" },
                    ].map((btn) => (
                      <button
                        key={btn.pct}
                        type="button"
                        className={`px-2 py-1 text-xs rounded-xs border font-medium transition-colors ${
                          dropChanceInput === btn.pct
                            ? "bg-emerald-500 text-white border-emerald-400 font-bold"
                            : "bg-secondary/70 hover:bg-secondary text-muted-foreground border-border"
                        }`}
                        onClick={() => setDropChanceInput(btn.pct)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prévia de Conversão DayZ types.xml */}
                {selectedItemForDrop && (
                  <div className="p-2.5 rounded-sm bg-muted/30 border border-border/60 text-xs space-y-1.5">
                    <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="size-3 text-amber-400" />
                      Valores que serão gravados no types.xml:
                    </div>
                    {(() => {
                      const computed = applyDropChanceToRow(
                        selectedItemForDrop.row,
                        dropChanceInput,
                      );
                      return (
                        <div className="grid grid-cols-3 gap-2 font-mono text-center">
                          <div className="bg-background/80 p-1.5 rounded-xs border border-border">
                            <span className="text-[10px] text-muted-foreground block">nominal</span>
                            <span className="font-bold text-emerald-400">{computed.nominal}</span>
                            <span className="text-[9px] text-muted-foreground block">
                              (máx no mapa)
                            </span>
                          </div>
                          <div className="bg-background/80 p-1.5 rounded-xs border border-border">
                            <span className="text-[10px] text-muted-foreground block">min</span>
                            <span className="font-bold text-emerald-400">{computed.min}</span>
                            <span className="text-[9px] text-muted-foreground block">
                              (respawn trigger)
                            </span>
                          </div>
                          <div className="bg-background/80 p-1.5 rounded-xs border border-border">
                            <span className="text-[10px] text-muted-foreground block">restock</span>
                            <span className="font-bold text-emerald-400">{computed.restock}s</span>
                            <span className="text-[9px] text-muted-foreground block">
                              (tempo espera)
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                      💡 No DayZ, o loot funciona através do ciclo de reposição de itens. Ao definir
                      a chance, o editor calibra a densidade no mapa e a velocidade de
                      reabastecimento.
                    </p>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
                  <button className="btn-ghost text-xs" onClick={() => setDropModalOpen(false)}>
                    Cancelar
                  </button>

                  <button
                    className="btn-ghost text-xs text-amber-300 hover:bg-amber-500/10 border border-amber-500/30"
                    onClick={() => {
                      const set = new Set(filtered.map((x) => x.i));
                      setRows((rs) =>
                        rs.map((r, j) =>
                          set.has(j) ? { ...r, ...applyDropChanceToRow(r, dropChanceInput) } : r,
                        ),
                      );
                      setDirty(true);
                      toast.success(
                        `Chance de drop definida para ${dropChanceInput}% em todos os ${filtered.length} itens filtrados!`,
                      );
                      setDropModalOpen(false);
                    }}
                  >
                    Aplicar a Todos os Filtrados ({filtered.length})
                  </button>

                  {selectedItemForDrop && (
                    <button
                      className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                      onClick={() => {
                        upd(
                          selectedItemForDrop.index,
                          applyDropChanceToRow(selectedItemForDrop.row, dropChanceInput),
                        );
                        toast.success(
                          `Chance de drop de ${selectedItemForDrop.row.name} atualizada para ${dropChanceInput}%!`,
                        );
                        setDropModalOpen(false);
                      }}
                    >
                      Salvar {dropChanceInput}% no Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
