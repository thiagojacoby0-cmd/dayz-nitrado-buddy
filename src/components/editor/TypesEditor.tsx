import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { missionFile, type Session } from "@/lib/nitrado";
import { weightOf } from "@/lib/weights";
import { FileState, useRemoteFile } from "./useFile";
import { StarterLootEditor } from "./StarterLootEditor";
import { ITEM_LABELS } from "@/lib/demo-data";

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
          const label = (ITEM_LABELS[r.name] ?? "").toLowerCase();
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

            {/* Linha de Ações em Lote: Multiplicador e Durabilidade */}
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
                  const label = ITEM_LABELS[r.name];
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
                            colSpan={NUM.length + 6}
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
              quantmin/quantmax (-1 = padrão)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
