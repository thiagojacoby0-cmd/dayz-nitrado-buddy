import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import mapImg from "@/assets/map-chernarus.jpg";

type Kind = "Base" | "Trader" | "Zona PvP" | "Zona segura" | "Loot" | "Ponto de interesse";
const KINDS: Kind[] = ["Base", "Trader", "Zona PvP", "Zona segura", "Loot", "Ponto de interesse"];
const COLORS: Record<Kind, string> = {
  Base: "var(--primary)", Trader: "var(--chart-2)", "Zona PvP": "var(--destructive)",
  "Zona segura": "var(--chart-3)", Loot: "var(--chart-4)", "Ponto de interesse": "var(--chart-5)",
};
type Marker = { id: string; name: string; kind: Kind; x: number; z: number; owner: string; members: string; notes: string; created: string };
const SIZE = 15360; // Chernarus world size in meters
const KEY = "dayz-map-markers";

export function MapPanel() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<Set<Kind>>(new Set(KINDS));
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<Kind | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { try { setMarkers(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* */ } }, []);
  const save = (m: Marker[]) => { setMarkers(m); localStorage.setItem(KEY, JSON.stringify(m)); };

  const toWorld = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: Math.round(((e.clientX - r.left) / r.width) * SIZE), z: Math.round((1 - (e.clientY - r.top) / r.height) * SIZE) };
  };
  const onClick = (e: React.MouseEvent) => {
    if (!adding) return;
    const p = toWorld(e);
    const m: Marker = { id: crypto.randomUUID(), name: `${adding} ${markers.length + 1}`, kind: adding, ...p, owner: "", members: "", notes: "", created: new Date().toLocaleDateString("pt-BR") };
    save([...markers, m]); setSel(m.id); setAdding(null);
  };
  const upd = (patch: Partial<Marker>) => save(markers.map((m) => (m.id === sel ? { ...m, ...patch } : m)));
  const visible = useMemo(() => markers.filter((m) => filter.has(m.kind) && (m.name + m.owner + m.members).toLowerCase().includes(search.toLowerCase())), [markers, filter, search]);
  const cur = markers.find((m) => m.id === sel);

  const exportJson = () => { navigator.clipboard.writeText(JSON.stringify(markers, null, 2)); toast.success("Marcadores copiados"); };
  const importJson = () => { const t = prompt("Cole o JSON de marcadores"); if (!t) return; try { save(JSON.parse(t)); toast.success("Importado"); } catch { toast.error("JSON inválido"); } };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="panel space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Adicionar:</span>
          {KINDS.map((k) => (
            <button key={k} className={adding === k ? "btn-primary" : "btn-ghost"} onClick={() => setAdding(adding === k ? null : k)}>
              <span className="size-2 rounded-full" style={{ background: COLORS[k] }} />{k}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <button className="btn-ghost" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>−</button>
            <span className="w-10 text-center text-xs">{zoom}x</span>
            <button className="btn-ghost" onClick={() => setZoom((z) => Math.min(4, z + 0.5))}>+</button>
          </div>
        </div>
        {adding && <p className="text-xs text-primary">Clique no mapa para posicionar: {adding}</p>}
        <div className="max-h-[70vh] overflow-auto rounded-sm border border-border">
          <div ref={ref} className={`relative ${adding ? "cursor-crosshair" : ""}`} style={{ width: `${zoom * 100}%`, aspectRatio: "1" }}
            onClick={onClick} onMouseMove={(e) => setHover(toWorld(e))} onMouseLeave={() => setHover(null)}>
            <img src={mapImg} alt="Mapa" width={1536} height={1536} className="absolute inset-0 size-full select-none" draggable={false} />
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(to right, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 1px)", backgroundSize: "10% 10%" }} />
            {visible.map((m) => (
              <button key={m.id} title={m.name} onClick={(e) => { e.stopPropagation(); setSel(m.id); }}
                className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(m.x / SIZE) * 100}%`, top: `${(1 - m.z / SIZE) * 100}%` }}>
                <span className={`block size-4 rounded-full border-2 border-background ${sel === m.id ? "ring-2 ring-foreground" : ""}`} style={{ background: COLORS[m.kind] }} />
                <span className="absolute left-5 top-0 whitespace-nowrap rounded-sm bg-background/80 px-1 text-[10px]">{m.name}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{hover ? `X ${hover.x} · Z ${hover.z}` : "Passe o mouse no mapa para ver as coordenadas"}</p>
      </div>

      <aside className="space-y-3">
        {cur ? (
          <div className="panel space-y-2 p-3">
            <h3 className="font-display text-xl text-primary">Detalhes</h3>
            <input className="field w-full" value={cur.name} onChange={(e) => upd({ name: e.target.value })} />
            <select className="field w-full" value={cur.kind} onChange={(e) => upd({ kind: e.target.value as Kind })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
            <div className="flex gap-2">
              <label className="flex-1 text-xs">X<input className="field w-full" type="number" value={cur.x} onChange={(e) => upd({ x: +e.target.value })} /></label>
              <label className="flex-1 text-xs">Z<input className="field w-full" type="number" value={cur.z} onChange={(e) => upd({ z: +e.target.value })} /></label>
            </div>
            <input className="field w-full" placeholder="Dono / clã" value={cur.owner} onChange={(e) => upd({ owner: e.target.value })} />
            <input className="field w-full" placeholder="Membros (separe por vírgula)" value={cur.members} onChange={(e) => upd({ members: e.target.value })} />
            <textarea className="w-full rounded-sm border border-input bg-background p-2 text-sm" rows={4} placeholder="Anotações (portões, códigos, regras…)" value={cur.notes} onChange={(e) => upd({ notes: e.target.value })} />
            <p className="text-xs text-muted-foreground">Criado em {cur.created}</p>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(`${cur.x} 0 ${cur.z}`); toast.success("Posição copiada"); }}>Copiar posição</button>
              <button className="btn-danger" onClick={() => { save(markers.filter((m) => m.id !== sel)); setSel(null); }}>Excluir</button>
            </div>
          </div>
        ) : <div className="panel p-3 text-sm text-muted-foreground">Escolha um tipo acima e clique no mapa para registrar uma base ou ponto. As informações ficam salvas neste navegador.</div>}

        <div className="panel space-y-2 p-3">
          <input className="field w-full" placeholder="Buscar por nome, dono ou membro" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-1">
            {KINDS.map((k) => (
              <button key={k} className={`rounded-sm border px-2 py-0.5 text-xs ${filter.has(k) ? "border-primary" : "border-border opacity-50"}`}
                onClick={() => { const f = new Set(filter); f.has(k) ? f.delete(k) : f.add(k); setFilter(f); }}>{k} ({markers.filter((m) => m.kind === k).length})</button>
            ))}
          </div>
          <ul className="max-h-64 space-y-1 overflow-auto">
            {visible.map((m) => (
              <li key={m.id}><button className={`flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-secondary ${sel === m.id ? "bg-secondary" : ""}`} onClick={() => setSel(m.id)}>
                <span className="size-2 rounded-full" style={{ background: COLORS[m.kind] }} />{m.name}<span className="ml-auto text-xs text-muted-foreground">{m.owner}</span>
              </button></li>
            ))}
          </ul>
          <div className="flex gap-2"><button className="btn-ghost" onClick={exportJson}>Exportar</button><button className="btn-ghost" onClick={importJson}>Importar</button></div>
        </div>
      </aside>
    </div>
  );
}
