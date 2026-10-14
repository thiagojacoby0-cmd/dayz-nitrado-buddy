import { useEffect, useState } from "react";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";

/** Colunas que funcionam como liga/desliga (valor "1" = ativo, "0" = inativo). */
const BOOL_COLS = new Set([
  "active", "enabled", "dynamic_event", "count_in_cargo", "count_in_hoarder",
  "count_in_map", "count_in_player", "crafted", "deloot", "player", "usable", "checked",
]);

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-24 items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${
        on ? "border-green-500/50 bg-green-500/15 text-green-400" : "border-border bg-muted text-muted-foreground"
      }`}
    >
      <span className={`h-3 w-3 rounded-full ${on ? "bg-green-400" : "bg-muted-foreground/50"}`} />
      {on ? "Ativo" : "Inativo"}
    </button>
  );
}

/** Edita elementos repetidos de um XML (ex: <event> em events.xml, <var> em globals.xml). */
export function XmlTableEditor({ s, rel, tag, mode }: { s: Session; rel: string; tag: string; mode: "children" | "attrs" }) {
  const path = missionFile(s, rel);
  const f = useRemoteFile(s, path);
  const [doc, setDoc] = useState<Document | null>(null);
  const [, force] = useState(0);
  const [q, setQ] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (f.text) { setDoc(new DOMParser().parseFromString(f.text, "text/xml")); setDirty(false); } }, [f.text]);
  if (!f.text || !doc) return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  const els = Array.from(doc.getElementsByTagName(tag));
  const cols = new Set<string>();
  els.forEach((e) => {
    if (mode === "attrs") Array.from(e.attributes).forEach((a) => a.name !== "name" && cols.add(a.name));
    else Array.from(e.children).forEach((c) => c.children.length === 0 && cols.add(c.tagName));
  });
  const columns = Array.from(cols);
  const set = (e: Element, k: string, v: string) => {
    if (mode === "attrs") e.setAttribute(k, v);
    else { const c = e.getElementsByTagName(k)[0]; if (c) c.textContent = v; }
    setDirty(true); force((n) => n + 1);
  };
  const get = (e: Element, k: string) => mode === "attrs" ? e.getAttribute(k) ?? "" : e.getElementsByTagName(k)[0]?.textContent ?? "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input className="field w-64" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-xs text-muted-foreground">{els.length} entradas · {rel}</span>
        <button className="btn-primary ml-auto" disabled={!dirty || f.saving} onClick={() => f.save(new XMLSerializer().serializeToString(doc))}>
          {f.saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary font-display text-sm tracking-wider text-muted-foreground">
            <tr><th className="p-2">name</th>{columns.map((c) => <th key={c} className="p-2">{c}</th>)}</tr>
          </thead>
          <tbody>
            {els.filter((e) => (e.getAttribute("name") ?? "").toLowerCase().includes(q.toLowerCase())).map((e, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/50">
                <td className="min-w-56 px-2 font-mono font-semibold">{e.getAttribute("name")}</td>
                {columns.map((c) => (
                  <td key={c} className="min-w-20 px-1">
                    {mode === "children" && !e.getElementsByTagName(c)[0] ? <span className="text-muted-foreground">—</span> :
                      BOOL_COLS.has(c) && (get(e, c) === "0" || get(e, c) === "1") ?
                        <Toggle on={get(e, c) === "1"} onToggle={() => set(e, c, get(e, c) === "1" ? "0" : "1")} /> :
                        <input className="cell" value={get(e, c)} onChange={(ev) => set(e, c, ev.target.value)} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
