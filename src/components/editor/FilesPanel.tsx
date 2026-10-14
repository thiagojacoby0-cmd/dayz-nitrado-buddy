import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, readFile, writeFile, type Session } from "@/lib/nitrado";

type Entry = { type: string; path: string; name: string; size?: number };

export function FilesPanel({ s, root, onSetMission }: { s: Session; root: string; onSetMission: (p: string) => void }) {
  const [dir, setDir] = useState(root);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState<{ path: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setDir(root); }, [root]);
  useEffect(() => {
    if (!dir) return;
    setBusy(true);
    api(s, "GET", `/services/${s.serviceId}/gameservers/file_server/list?dir=${encodeURIComponent(dir)}`)
      .then((r) => setEntries((r.data?.entries ?? []).sort((a: Entry, b: Entry) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1))))
      .catch((e) => toast.error(e.message)).finally(() => setBusy(false));
  }, [dir, s]);

  const up = dir.replace(/\/[^/]+\/?$/, "") || "/";
  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <div className="panel h-fit">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <button className="btn-ghost h-7" onClick={() => setDir(up)}>↑</button>
          <span className="truncate font-mono text-xs" title={dir}>{dir}</span>
        </div>
        <div className="flex border-b border-border p-2"><button className="btn-ghost h-7 w-full justify-center text-xs" onClick={() => { onSetMission(dir); toast.success("Pasta da missão definida"); }}>Usar esta pasta como missão</button></div>
        <ul className="max-h-[60vh] overflow-y-auto text-sm">
          {busy && <li className="p-2 text-xs text-muted-foreground">Carregando…</li>}
          {entries.map((e) => (
            <li key={e.path}>
              <button className="w-full truncate px-3 py-1 text-left font-mono text-xs hover:bg-muted"
                onClick={async () => {
                  if (e.type === "dir") return setDir(e.path);
                  try { setOpen({ path: e.path, text: await readFile(s, e.path) }); } catch (err) { toast.error((err as Error).message); }
                }}>
                {e.type === "dir" ? "📁" : "📄"} {e.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel p-3">
        {open ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-xs">{open.path}</span>
              <button className="btn-primary ml-auto" onClick={async () => {
                try { await writeFile(s, open.path, open.text); toast.success("Arquivo salvo"); } catch (e) { toast.error((e as Error).message); }
              }}>Salvar</button>
            </div>
            <textarea className="h-[65vh] w-full bg-background p-2 font-mono text-xs outline-none" value={open.text}
              onChange={(e) => setOpen({ ...open, text: e.target.value })} spellCheck={false} />
          </div>
        ) : <p className="p-6 text-sm text-muted-foreground">Abra qualquer arquivo do servidor para editar (XML, JSON, cfg…).</p>}
      </div>
    </div>
  );
}
