import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, demoSession, type Session } from "@/lib/nitrado";
import { TypesEditor } from "@/components/editor/TypesEditor";
import { CreatureLootEditor } from "@/components/editor/CreatureLootEditor";
import { EventsEditor } from "@/components/editor/EventsEditor";
import { XmlTableEditor } from "@/components/editor/XmlTableEditor";
import { GameplayEditor } from "@/components/editor/GameplayEditor";
import { WeightPanel } from "@/components/editor/WeightPanel";
import { FilesPanel } from "@/components/editor/FilesPanel";
import { ServerPanel } from "@/components/editor/ServerPanel";
import { MapPanel } from "@/components/editor/MapPanel";
import { ToolsPanel } from "@/components/editor/ToolsPanel";
import { ClothingSlotsEditor } from "@/components/editor/ClothingSlotsEditor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fronteira Z Editor · Servidor Nitrado Xbox" },
      {
        name: "description",
        content:
          "Edite loot, eventos, gameplay, peso e configurações do seu servidor DayZ Xbox na Nitrado.",
      },
      { property: "og:title", content: "Fronteira Z Editor · Servidor Nitrado Xbox" },
      {
        property: "og:description",
        content: "Editor completo para servidores DayZ Xbox hospedados na Nitrado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = [
  "Servidor",
  "Mapa",
  "Loot",
  "Roupas e Slots",
  "Animais e Zumbis",
  "Peso",
  "Gameplay",
  "Eventos",
  "Globals",
  "Arquivos",
  "Ferramentas",
] as const;
type Tab = (typeof TABS)[number];

type NitradoService = {
  id: string | number;
  type: string;
  details?: { name?: string; game?: string };
};

function Index() {
  const [token, setToken] = useState("");
  const [services, setServices] = useState<NitradoService[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [mission, setMission] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gs, setGs] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("Servidor");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const list = ((r as { data?: { services?: NitradoService[] } })?.data?.services ?? []).filter(
        (x) => x.type === "gameserver",
      );
      setServices(list);
      localStorage.setItem("nitrado-token", t);
      if (!list.length) toast.error("Nenhum servidor encontrado nesta conta");
      else if (!list.find((x) => String(x.id) === serviceId)) setServiceId(String(list[0].id));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (token && !services.length) connect(token);
  }, [token]); // eslint-disable-line

  const loadGs = useCallback(async () => {
    if (!serviceId || !token) return;
    try {
      const r = await api({ token }, "GET", `/services/${serviceId}/gameservers`);
      const g = r.data?.gameserver;
      setGs(g);
      localStorage.setItem("nitrado-service", serviceId);
      if (!localStorage.getItem("nitrado-mission")) {
        const base = String(g?.game_specific?.path ?? "").replace(/\/$/, "");
        const m = `${base}/dayzxb_missions/${g?.settings?.config?.mission ?? "dayzOffline.chernarusplus"}`;
        setMission(m);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [serviceId, token]);
  useEffect(() => {
    loadGs();
  }, [loadGs]);

  const session: Session = useMemo(
    () => ({ token, serviceId, mission }),
    [token, serviceId, mission],
  );
  const updMission = (m: string) => {
    setMission(m);
    localStorage.setItem("nitrado-mission", m);
  };
  const root = String(gs?.game_specific?.path ?? "/");

  if (!services.length) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-background">
        <div className="panel w-full max-w-md space-y-5 p-8 border-primary/30 shadow-2xl">
          <div className="space-y-1">
            <h1 className="text-5xl text-primary font-display tracking-wider">
              Fronteira Z Editor
            </h1>
            <p className="text-sm text-muted-foreground">
              Editor completo para servidores DayZ Xbox: loot do mapa, kit inicial de spawn, animais
              e zumbis, durabilidade e eventos.
            </p>
          </div>

          <div className="p-3.5 rounded-md border border-primary/40 bg-primary/10 space-y-2">
            <div className="font-semibold text-sm text-primary flex items-center gap-1.5">
              <span>🎮</span> Não tem token da Nitrado ainda?
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Você pode usar o editor agora mesmo no modo demonstração com todos os arquivos do DayZ
              liberados (Loot, Animais e Zumbis, Kit Inicial, Durabilidade e Mapa).
            </p>
            <button
              className="btn-primary w-full justify-center text-sm py-2 shadow-md shadow-primary/20"
              onClick={() => {
                const d = demoSession();
                localStorage.clear();
                setToken(d.token);
                setServiceId(d.serviceId);
                setMission(d.mission);
                setServices([
                  {
                    id: d.serviceId,
                    type: "gameserver",
                    details: { name: "Servidor Demo · DayZ Xbox" },
                  },
                ]);
              }}
            >
              🚀 Entrar no Modo Demonstração (Sem Token)
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground absolute">
              ou conecte com sua conta
            </span>
          </div>

          <div className="space-y-3">
            <input
              className="field w-full text-xs"
              type="password"
              placeholder="Token de acesso da Nitrado (opcional)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="btn-ghost w-full justify-center text-xs"
              disabled={busy || !token}
              onClick={() => connect()}
            >
              {busy ? "Conectando ao servidor…" : "Conectar com Token da Nitrado"}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            No modo demonstração nada é alterado no servidor real e você pode testar todas as
            tabelas livremente.
          </p>
        </div>
      </main>
    );
  }

  const isDemoMode = token === "demo";

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-sidebar">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl text-primary font-display">Fronteira Z Editor</h1>
            {isDemoMode && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-primary/20 border border-primary/40 text-primary">
                Modo Demonstração (Sem Token)
              </span>
            )}
          </div>
          <select
            className="field"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              localStorage.removeItem("nitrado-mission");
            }}
          >
            {services.map((x) => (
              <option key={x.id} value={x.id}>
                #{x.id} · {x.details?.name ?? x.details?.game ?? "Servidor"}
              </option>
            ))}
          </select>
          <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
            Missão
            <input
              className="field flex-1 font-mono text-xs"
              value={mission}
              onChange={(e) => updMission(e.target.value)}
            />
          </label>
          <button
            className="btn-ghost"
            onClick={() => {
              localStorage.clear();
              setToken("");
              setServices([]);
            }}
          >
            Sair
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 font-display text-lg tracking-wider ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>
      <section className="p-4">
        {tab === "Servidor" && <ServerPanel s={session} gs={gs} reload={loadGs} root={root} />}
        {tab === "Loot" && <TypesEditor s={session} />}
        {tab === "Roupas e Slots" && <ClothingSlotsEditor />}
        {tab === "Animais e Zumbis" && <CreatureLootEditor s={session} />}
        {tab === "Peso" && <WeightPanel gameplay={gameplay} />}
        {tab === "Gameplay" && <GameplayEditor s={session} onJson={setGameplay} />}
        {tab === "Eventos" && <EventsEditor s={session} />}
        {tab === "Globals" && (
          <XmlTableEditor s={session} rel="db/globals.xml" tag="var" mode="attrs" />
        )}
        {tab === "Mapa" && <MapPanel />}
        {tab === "Ferramentas" && <ToolsPanel />}
        {tab === "Arquivos" && <FilesPanel s={session} root={root} onSetMission={updMission} />}
      </section>
    </main>
  );
}
