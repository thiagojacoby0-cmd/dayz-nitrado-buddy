import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type Session } from "@/lib/nitrado";

export function ServerPanel({ s, gs, reload }: { s: Session; gs: any; reload: () => void }) {
  const [settings, setSettings] = useState<Record<string, Record<string, any>>>({});
  const [changed, setChanged] = useState<Record<string, string>>({});
  useEffect(() => { setSettings(gs?.settings ?? {}); setChanged({}); }, [gs]);

  const action = async (what: "restart" | "stop") => {
    try { await api(s, "POST", `/services/${s.serviceId}/gameservers/${what}`); toast.success(what === "restart" ? "Reiniciando servidor…" : "Parando servidor…"); setTimeout(reload, 4000); }
    catch (e) { toast.error((e as Error).message); }
  };
  const save = async () => {
    try {
      for (const [ck, value] of Object.entries(changed)) {
        const [category, key] = ck.split("::");
        await api(s, "POST", `/services/${s.serviceId}/gameservers/settings`, { category, key, value });
      }
      toast.success("Configurações salvas"); setChanged({}); reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-6 p-4">
        <div><p className="text-xs text-muted-foreground">Status</p><p className={`font-display text-2xl ${gs?.status === "started" ? "text-success" : "text-destructive"}`}>{gs?.status ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Jogadores</p><p className="font-display text-2xl">{gs?.query?.player_current ?? 0} / {gs?.slots ?? "?"}</p></div>
        <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-semibold">{gs?.query?.server_name ?? gs?.settings?.config?.hostname ?? "—"}</p></div>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost" onClick={reload}>Atualizar</button>
          <button className="btn-danger" onClick={() => action("stop")}>Parar</button>
          <button className="btn-primary" onClick={() => action("restart")}>Reiniciar</button>
        </div>
      </div>
      <div className="flex justify-end"><button className="btn-primary" disabled={!Object.keys(changed).length} onClick={save}>Salvar {Object.keys(changed).length || ""} alterações</button></div>
      {Object.entries(settings).map(([cat, vals]) => vals && typeof vals === "object" && (
        <div key={cat} className="panel p-4">
          <h3 className="mb-2 text-xl text-primary">{cat}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(vals).map(([k, v]) => {
              const ck = `${cat}::${k}`;
              const val = changed[ck] ?? (typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
              return (
                <label key={k} className="flex items-center gap-2">
                  <span className="w-48 truncate font-mono text-xs" title={k}>{k}</span>
                  <input className="field flex-1 font-mono" value={val} onChange={(e) => setChanged({ ...changed, [ck]: e.target.value })} />
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
