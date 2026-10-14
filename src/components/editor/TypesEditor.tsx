import { Fragment, useEffect, useMemo, useState } from "react";
import { missionFile, type Session } from "@/lib/nitrado";
import { weightOf } from "@/lib/weights";
import { FileState, useRemoteFile } from "./useFile";

type Row = {
  name: string; nominal: string; min: string; lifetime: string; restock: string; quantmin: string; quantmax: string; cost: string;
  category: string; usage: string; value: string; tag: string; flags: Record<string, string>;
};
const NUM = ["nominal", "min", "lifetime", "restock", "quantmin", "quantmax", "cost"] as const;
const FLAGS = ["count_in_cargo", "count_in_hoarder", "count_in_map", "count_in_player", "crafted", "deloot"];
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
    const attrs = (n: string) => Array.from(t.getElementsByTagName(n)).map((e) => e.getAttribute("name")).filter(Boolean).join(",");
    const f = t.getElementsByTagName("flags")[0];
    const flags: Record<string, string> = {};
    FLAGS.forEach((k) => (flags[k] = f?.getAttribute(k) ?? "0"));
    return {
      name: t.getAttribute("name") ?? "", nominal: g("nominal"), min: g("min"), lifetime: g("lifetime"), restock: g("restock"),
      quantmin: g("quantmin"), quantmax: g("quantmax"), cost: g("cost"), category: attrs("category"), usage: attrs("usage"),
      value: attrs("value"), tag: attrs("tag"), flags,
    };
  });
}

function serialize(rows: Row[]) {
  const list = (tag: string, v: string) => v.split(",").map((x) => x.trim()).filter(Boolean).map((x) => `\t\t<${tag} name="${x}"/>\n`).join("");
  const body = rows.map((r) => {
    let s = `\t<type name="${r.name}">\n`;
    NUM.forEach((k) => { if (r[k] !== "") s += `\t\t<${k}>${r[k]}</${k}>\n`; });
    s += `\t\t<flags ${FLAGS.map((k) => `${k}="${r.flags[k]}"`).join(" ")}/>\n`;
    s += list("category", r.category) + list("usage", r.usage) + list("value", r.value) + list("tag", r.tag);
    return s + "\t</type>\n";
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n<types>\n${body}</types>\n`;
}

const PAGE = 60;
const LABEL: Record<string, string> = { nominal: "Quantidade no mapa", min: "Mínimo", lifetime: "Tempo no chão (s)", restock: "Reposição (s)", quantmin: "Carga mín %", quantmax: "Carga máx %", cost: "Prioridade" };
const HELP: Record<string, string> = {
  nominal: "Quantos desse item o servidor tenta manter espalhados no mapa",
  min: "Quando cair abaixo disso, o servidor volta a gerar o item",
  lifetime: "Quanto tempo o item fica no chão antes de sumir (segundos)",
  restock: "Espera (segundos) antes de repor o item",
  quantmin: "Carga/quantidade mínima (munição, água…). -1 = padrão",
  quantmax: "Carga/quantidade máxima. -1 = padrão",
  cost: "Prioridade de spawn (normalmente 100)",
};
const USAGES: [string, string][] = [["Military","Militar"],["Police","Polícia"],["Medic","Hospital/Médico"],["Firefighter","Bombeiros"],["Industrial","Industrial"],["Farm","Fazenda"],["Coast","Litoral"],["Town","Cidade"],["Village","Vila"],["Hunting","Caça"],["Office","Escritório"],["School","Escola"],["Prison","Prisão"],["Lunapark","Parque"],["ContaminatedArea","Zona contaminada"],["Historical","Histórico"]];
const TIERS: [string, string][] = [["Tier1","Tier 1 · Litoral (fraco)"],["Tier2","Tier 2 · Interior"],["Tier3","Tier 3 · Norte"],["Tier4","Tier 4 · Militar forte"],["Unique","Único"]];
const TAGS: [string, string][] = [["floor","No chão"],["shelves","Em prateleiras"],["ground","Ao ar livre"]];
const CATS: [string, string][] = [["weapons","Armas"],["clothes","Roupas"],["food","Comida"],["tools","Ferramentas"],["containers","Recipientes"],["explosives","Explosivos"],["vehiclesparts","Peças de veículo"],["lootdispatch","Recompensas de eventos"]];

function Chips({ title, opts, value, onChange }: { title: string; opts: [string, string][]; value: string; onChange: (v: string) => void }) {
  const cur = value.split(",").filter(Boolean);
  return (
    <div><p className="mb-1 text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1">{opts.map(([k, l]) => { const on = cur.includes(k); return (
        <button key={k} onClick={() => onChange((on ? cur.filter((x) => x !== k) : [...cur, k]).join(","))}
          className={`rounded-full border px-2 py-0.5 text-xs ${on ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>{l}</button>); })}</div>
    </div>
  );
}

export function TypesEditor({ s }: { s: Session }) {
  const path = missionFile(s, "db/types.xml");
  const f = useRemoteFile(s, path);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(0);
  const [mult, setMult] = useState("2");
  const [dirty, setDirty] = useState(false);
  const [edit, setEdit] = useState<number | null>(null);

  useEffect(() => { if (f.text) { setRows(parse(f.text)); setDirty(false); } }, [f.text]);

  const cats = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.category.split(",")).filter(Boolean))).sort(), [rows]);
  const filtered = useMemo(() => rows.map((r, i) => ({ r, i })).filter(({ r }) =>
    r.name.toLowerCase().includes(q.toLowerCase()) && (!cat || r.category.split(",").includes(cat))), [rows, q, cat]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const upd = (i: number, patch: Partial<Row>) => { setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r))); setDirty(true); };
  const bulk = () => {
    const m = parseFloat(mult); if (!m) return;
    const set = new Set(filtered.map((x) => x.i));
    setRows((rs) => rs.map((r, j) => set.has(j) ? { ...r, nominal: String(Math.round(+r.nominal * m)), min: String(Math.round(+r.min * m)) } : r));
    setDirty(true);
  };
  const add = () => {
    const name = prompt("Nome da classe do item (ex: AKM)"); if (!name) return;
    setRows((rs) => [{ name, nominal: "5", min: "2", lifetime: "14400", restock: "0", quantmin: "-1", quantmax: "-1", cost: "100", category: "", usage: "", value: "", tag: "", flags: Object.fromEntries(FLAGS.map((k) => [k, k === "count_in_cargo" || k === "count_in_hoarder" || k === "count_in_map" || k === "count_in_player" ? "1" : "0"])) }, ...rs]);
    setQ(name); setDirty(true);
  };

  if (!f.text) return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-64" placeholder="Buscar item…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <select className="field" value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }}>
          <option value="">Todas categorias</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} de {rows.length} itens</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Multiplicar quantidade/mínimo dos filtrados ×</span>
          <input className="field w-16" value={mult} onChange={(e) => setMult(e.target.value)} />
          <button className="btn-ghost" onClick={bulk}>Aplicar</button>
          <button className="btn-ghost" onClick={add}>+ Item</button>
          <button className="btn-primary" disabled={!dirty || f.saving} onClick={() => f.save(serialize(rows))}>{f.saving ? "Salvando…" : "Salvar types.xml"}</button>
        </div>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary font-display text-sm tracking-wider text-muted-foreground">
            <tr>
              <th className="p-2">Item</th><th className="p-2" title="Peso de referência (fixo no Xbox)">Peso</th>
              {NUM.map((k) => <th key={k} className="p-2" title={HELP[k]}>{LABEL[k]} ⓘ</th>)}
              <th className="p-2" title="Locais e regiões onde o item aparece">Onde cai ⓘ</th>
              <th className="p-2" title={FLAGS.map((k) => `${k.replace("count_in_", "").charAt(0).toUpperCase()} = ${FLAG_PT[k]}`).join("\n")}>flags ⓘ</th><th />
            </tr>
          </thead>
          <tbody>
            {view.map(({ r, i }) => {
              const w = weightOf(r.name);
              return (
                <Fragment key={i}><tr className="border-t border-border hover:bg-muted/50">
                  <td className="min-w-48 px-2 font-mono font-semibold">{r.name}</td>
                  <td className="whitespace-nowrap px-2 font-mono text-primary">{w !== undefined ? `${(w / 1000).toFixed(2)} kg` : "—"}</td>
                  {NUM.map((k) => <td key={k} className="w-20 px-1"><input className="cell" value={r[k]} onChange={(e) => upd(i, { [k]: e.target.value })} /></td>)}
                  <td className="min-w-40 px-1"><button className="btn-ghost h-6 w-full truncate text-xs" onClick={() => setEdit(edit === i ? null : i)}>
                    {[r.usage, r.value].filter(Boolean).join(" · ").replace(/,/g, ", ") || "Escolher…"}</button></td>
                  <td className="px-1">
                    <div className="flex gap-0.5">
                      {FLAGS.map((k) => (
                        <button key={k} title={`${FLAG_PT[k]} — clique para ${r.flags[k] === "1" ? "desativar" : "ativar"}`}
                          onClick={() => upd(i, { flags: { ...r.flags, [k]: r.flags[k] === "1" ? "0" : "1" } })}
                          className={`h-5 w-5 rounded-sm font-mono text-[9px] ${r.flags[k] === "1" ? "bg-green-500/25 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {k.replace("count_in_", "").charAt(0).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-1"><button className="text-destructive" title="Remover" onClick={() => { setRows((rs) => rs.filter((_, j) => j !== i)); setDirty(true); }}>✕</button></td>
                </tr>
                {edit === i && <tr className="bg-muted/30"><td colSpan={NUM.length + 5} className="space-y-3 p-3">
                  <Chips title="Tipo de lugar (também define de quais zumbis cai: militar, policial, médico…)" opts={USAGES} value={r.usage} onChange={(v) => upd(i, { usage: v })} />
                  <Chips title="Região do mapa (tier)" opts={TIERS} value={r.value} onChange={(v) => upd(i, { value: v })} />
                  <Chips title="Posição no prédio" opts={TAGS} value={r.tag} onChange={(v) => upd(i, { tag: v })} />
                  <Chips title="Categoria" opts={CATS} value={r.category} onChange={(v) => upd(i, { category: v })} />
                  <button className="btn-ghost h-7 text-xs" onClick={() => setEdit(null)}>Fechar</button>
                </td></tr>}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
        <span>Página {page + 1} / {pages}</span>
        <button className="btn-ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>›</button>
        <span className="ml-4 text-muted-foreground">Flags: C=cargo, H=hoarder, M=map, P=player, C=crafted, D=deloot</span>
      </div>
    </div>
  );
}
