import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, type Session } from "@/lib/nitrado";
import { TypesEditor } from "@/components/editor/TypesEditor";
import { XmlTableEditor } from "@/components/editor/XmlTableEditor";
import { GameplayEditor } from "@/components/editor/GameplayEditor";
import { WeightPanel } from "@/components/editor/WeightPanel";
import { FilesPanel } from "@/components/editor/FilesPanel";
import { ServerPanel } from "@/components/editor/ServerPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DayZ Editor · Servidor Nitrado Xbox" },
      { name: "description", content: "Edite loot, eventos, gameplay, peso e configurações do seu servidor DayZ Xbox na Nitrado." },
      { property: "og:title", content: "DayZ Editor · Servidor Nitrado Xbox" },
      { property: "og:description", content: "Editor completo para servidores DayZ Xbox hospedados na Nitrado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = ["Servidor", "Loot", "Peso", "Gameplay", "Eventos", "Globals", "Spawns", "Arquivos"] as const;
type Tab = (typeof TABS)[number];

function Index() {
  const [token, setToken] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [mission, setMission] = useState("");
  const [gs, setGs] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("Servidor");
  const [gameplay, setGameplay] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("nitrado-token") ?? "");
    setServiceId(localStorage.getItem("nitrado-service") ?? "");
    setMission(localStorage.getItem("nitrado-mission") ?? "");
  }, []);

  const connect = async (t = token) => {
    if (!t) return;
    setBusy(true);
    try {
      const r = await api({ token: t }, "GET", "/services");
      const list = (r.data?.services ?? []).filter((x: any) => x.type === "gameserver");
      setServices(list);
      localStorage.setItem("nitrado-token", t);
      if (!list.length) toast.error("Nenhum servidor encontrado nesta conta");
      else if (!list.find((x: any) => String(x.id) === serviceId)) setServiceId(String(list[0].id));
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (token && !services.length) connect(token); }, [token]); // eslint-disable-line

  const loadGs = useCallback(async () => {
    if (!serviceId || !token) return;
    try {
      const r = await api({ token }, "GET", `/services/${serviceId}/gameservers`);
      const g = r.data?.gameserver; setGs(g);
      localStorage.setItem("nitrado-service", serviceId);
      if (!localStorage.getItem("nitrado-mission")) {
        const base = String(g?.game_specific?.path ?? "").replace(/\/$/, "");
        const m = `${base}/dayzxb_missions/${g?.settings?.config?.mission ?? "dayzOffline.chernarusplus"}`;
        setMission(m);
      }
    } catch (e) { toast.error((e as Error).message); }
  }, [serviceId, token]);
  useEffect(() => { loadGs(); }, [loadGs]);

  const session: Session = useMemo(() => ({ token, serviceId, mission }), [token, serviceId, mission]);
  const updMission = (m: string) => { setMission(m); localStorage.setItem("nitrado-mission", m); };
  const root = String(gs?.game_specific?.path ?? "/");

  if (!services.length) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="panel w-full max-w-md space-y-4 p-8">
          <h1 className="text-5xl text-primary">DayZ Editor</h1>
          <p className="text-sm text-muted-foreground">Conecte sua conta Nitrado para editar seu servidor DayZ Xbox: loot, eventos, gameplay, peso e configurações.</p>
          <input className="field w-full" type="password" placeholder="Token de acesso da Nitrado" value={token} onChange={(e) => setToken(e.target.value)} />
          <button className="btn-primary w-full justify-center" disabled={busy || !token} onClick={() => connect()}>{busy ? "Conectando…" : "Conectar"}</button>
          <p className="text-xs text-muted-foreground">Crie o token em nitrado.net → Minha conta → Developer Portal → Long-life Token (permissão "service"). Ele fica salvo só neste navegador.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-sidebar">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="text-3xl text-primary">DayZ Editor</h1>
          <select className="field" value={serviceId} onChange={(e) => { setServiceId(e.target.value); localStorage.removeItem("nitrado-mission"); }}>
            {services.map((x) => <option key={x.id} value={x.id}>#{x.id} · {x.details?.name ?? x.details?.game ?? "Servidor"}</option>)}
          </select>
          <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
            Missão
            <input className="field flex-1 font-mono text-xs" value={mission} onChange={(e) => updMission(e.target.value)} />
          </label>
          <button className="btn-ghost" onClick={() => { localStorage.clear(); setToken(""); setServices([]); }}>Sair</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 font-display text-lg tracking-wider ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </nav>
      </header>
      <section className="p-4">
        {tab === "Servidor" && <ServerPanel s={session} gs={gs} reload={loadGs} />}
        {tab === "Loot" && <TypesEditor s={session} />}
        {tab === "Peso" && <WeightPanel gameplay={gameplay} />}
        {tab === "Gameplay" && <GameplayEditor s={session} onJson={setGameplay} />}
        {tab === "Eventos" && <XmlTableEditor s={session} rel="db/events.xml" tag="event" mode="children" />}
        {tab === "Globals" && <XmlTableEditor s={session} rel="db/globals.xml" tag="var" mode="attrs" />}
        {tab === "Spawns" && <XmlTableEditor s={session} rel="cfgeventspawns.xml" tag="event" mode="children" />}
        {tab === "Arquivos" && <FilesPanel s={session} root={root} onSetMission={updMission} />}
      </section>
    </main>
  );
}
