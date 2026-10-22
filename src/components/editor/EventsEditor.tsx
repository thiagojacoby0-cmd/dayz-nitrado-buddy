import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";

export type DayzEvent = {
  name: string;
  nominal: string;
  min: string;
  max: string;
  lifetime: string;
  restock: string;
  saferadius: string;
  distanceradius: string;
  cleanupradius: string;
  position: string;
  limit: string;
  active: string;
  flags: {
    deletable: string;
    init_random: string;
    remove_damaged: string;
  };
};

type EventMetadata = {
  title: string;
  desc: string;
  icon: string;
  category: "convoys" | "crashes" | "vehicles" | "zones" | "animals" | "infected" | "other";
};

const EVENT_METADATA: Record<string, EventMetadata> = {
  PoliceConvoy: {
    title: "Comboio Policial (Police Convoy)",
    desc: "Viaturas policiais destruídas na estrada com zumbis policiais. Spawna armas policiais, munições e coletes raros.",
    icon: "🚓",
    category: "convoys",
  },
  MilitaryConvoy: {
    title: "Comboio Militar (Military Convoy)",
    desc: "Caminhões e jipes do exército emboscados. Loot militar de alto escalão (DMR, coletes pesados, fuzis e NVG).",
    icon: "🎖️",
    category: "convoys",
  },
  HeliCrash: {
    title: "Queda de Helicóptero Geral (Heli Crash)",
    desc: "Destroços de helicóptero militar fumegante. As melhores armas do jogo (M4A1, LAR, DMR, silenciadores).",
    icon: "🚁",
    category: "crashes",
  },
  Wreck_UH1Y: {
    title: "Helicóptero Americano UH-1Y Venom",
    desc: "Queda de helicóptero militar dos EUA com alarme e fumaça preta. Spawna equipamento ocidental da OTAN.",
    icon: "🚁",
    category: "crashes",
  },
  Wreck_Mi8: {
    title: "Helicóptero Russo Mi-8 Hip",
    desc: "Queda de helicóptero militar russo com fumaça verde. Spawna armamento do bloco oriental (SVD, VSS, ASVAL).",
    icon: "🚁",
    category: "crashes",
  },
  TrainWreck: {
    title: "Acidente de Trem (Train Wreck)",
    desc: "Trem de carga descarrilado nos trilhos da ferrovia. Spawna comida, materiais industriais e armas.",
    icon: "🚂",
    category: "crashes",
  },
  SantaSleigh: {
    title: "Trenó do Papai Noel (Evento Natal)",
    desc: "Trenó caído com renas e caixas de presente contendo itens especiais e raros.",
    icon: "🎅",
    category: "crashes",
  },
  DynamicContaminatedArea: {
    title: "Bombardeio Químico de Artilharia (Gás Tóxico Dinâmico)",
    desc: "Ataques de artilharia atingem cidades aleatórias criando nuvens tóxicas mortais sem traje NBC.",
    icon: "☣️",
    category: "zones",
  },
  StaticContaminatedArea: {
    title: "Zonas Contaminadas Permanentes (Pavlovo & Rify)",
    desc: "Nuvens eternas de gás POX guardando armas de nível máximo do servidor.",
    icon: "☠️",
    category: "zones",
  },
  VehicleOffroad02: {
    title: "Humvee M1025 Militar",
    desc: "Veículo militar 4x4 blindado para 4 jogadores com alta capacidade de carga.",
    icon: "🚙",
    category: "vehicles",
  },
  VehicleOffroadHatchback: {
    title: "Ada 4x4 (Niva)",
    desc: "Jipe 4x4 russo perfeito para subir montanhas e cruzar florestas.",
    icon: "🚙",
    category: "vehicles",
  },
  VehicleSedan02: {
    title: "Olga 24 (Sedan Volga)",
    desc: "Carro sedan clássico, espaçoso e muito rápido no asfalto.",
    icon: "🚗",
    category: "vehicles",
  },
  VehicleHatchback02: {
    title: "Gunter 2 (Golf Hatchback)",
    desc: "Carro hatchback esportivo com excelente aceleração.",
    icon: "🚗",
    category: "vehicles",
  },
  VehicleTruck01: {
    title: "Caminhão M3S (Praga)",
    desc: "Caminhão pesado de 6 rodas para carregar toras, chapas e construir bases grandes.",
    icon: "🚛",
    category: "vehicles",
  },
  AnimalBear: {
    title: "Ursos Selvagens no Mapa",
    desc: "Controle de população de ursos pardos nos bosques montanhosos.",
    icon: "🐻",
    category: "animals",
  },
  AnimalWolf: {
    title: "Matilhas de Lobos",
    desc: "Grupos de lobos caçadores agressivos nas florestas profundas.",
    icon: "🐺",
    category: "animals",
  },
  AnimalDeer: {
    title: "Cervos e Veados",
    desc: "População de cervos para caça de carne e couro.",
    icon: "🦌",
    category: "animals",
  },
  AnimalWildBoar: {
    title: "Javalis Selvagens",
    desc: "Javalis territoriais para caça e sobrevivência.",
    icon: "🐗",
    category: "animals",
  },
  InfectedArmy: {
    title: "Hordas de Zumbis Militares",
    desc: "Spawns de infectados fardados nas bases e quartéis do exército.",
    icon: "🪖",
    category: "infected",
  },
  InfectedPolice: {
    title: "Hordas de Zumbis Policiais",
    desc: "Spawns de policiais infectados nas delegacias e postos.",
    icon: "👮",
    category: "infected",
  },
  InfectedNBC: {
    title: "Zumbis com Roupa NBC",
    desc: "Infectados protegidos nas zonas de gás tóxico.",
    icon: "☣️",
    category: "infected",
  },
};

function parseEventsXml(xml: string): DayzEvent[] {
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    return Array.from(doc.getElementsByTagName("event")).map((e) => {
      const g = (tag: string) => e.getElementsByTagName(tag)[0]?.textContent ?? "";
      const f = e.getElementsByTagName("flags")[0];
      return {
        name: e.getAttribute("name") ?? "",
        nominal: g("nominal") || "1",
        min: g("min") || "1",
        max: g("max") || "2",
        lifetime: g("lifetime") || "300",
        restock: g("restock") || "0",
        saferadius: g("saferadius") || "500",
        distanceradius: g("distanceradius") || "500",
        cleanupradius: g("cleanupradius") || "100",
        position: g("position") || "player",
        limit: g("limit") || "custom",
        active: g("active") || "1",
        flags: {
          deletable: f?.getAttribute("deletable") ?? "0",
          init_random: f?.getAttribute("init_random") ?? "0",
          remove_damaged: f?.getAttribute("remove_damaged") ?? "1",
        },
      };
    });
  } catch (err) {
    console.error("Erro ao analisar events.xml:", err);
    return [];
  }
}

function serializeEventsXml(events: DayzEvent[]): string {
  const body = events
    .map(
      (ev) => `    <event name="${ev.name}">
        <nominal>${ev.nominal}</nominal>
        <min>${ev.min}</min>
        <max>${ev.max}</max>
        <lifetime>${ev.lifetime}</lifetime>
        <restock>${ev.restock}</restock>
        <saferadius>${ev.saferadius}</saferadius>
        <distanceradius>${ev.distanceradius}</distanceradius>
        <cleanupradius>${ev.cleanupradius}</cleanupradius>
        <flags deletable="${ev.flags.deletable}" init_random="${ev.flags.init_random}" remove_damaged="${ev.flags.remove_damaged}"/>
        <position>${ev.position}</position>
        <limit>${ev.limit}</limit>
        <active>${ev.active}</active>
    </event>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<events>\n${body}\n</events>\n`;
}

export function EventsEditor({ s }: { s: Session }) {
  const path = missionFile(s, "db/events.xml");
  const f = useRemoteFile(s, path);
  const [events, setEvents] = useState<DayzEvent[]>([]);
  const [dirty, setDirty] = useState(false);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    if (f.text) {
      setEvents(parseEventsXml(f.text));
      setDirty(false);
    }
  }, [f.text]);

  const updateEvent = (name: string, patch: Partial<DayzEvent>) => {
    setEvents((curr) => curr.map((ev) => (ev.name === name ? { ...ev, ...patch } : ev)));
    setDirty(true);
  };

  const save = async () => {
    try {
      const xml = serializeEventsXml(events);
      await f.save(xml);
      setDirty(false);
      toast.success(
        "Eventos salvos com sucesso no db/events.xml! Reinicie o servidor para aplicar.",
      );
    } catch (e) {
      toast.error(`Erro ao salvar events.xml: ${(e as Error).message}`);
    }
  };

  // Presets
  const applyPresetMoreConvoys = () => {
    setEvents((curr) =>
      curr.map((ev) => {
        if (ev.name === "PoliceConvoy" || ev.name === "MilitaryConvoy") {
          return {
            ...ev,
            active: "1",
            nominal: "4",
            min: "2",
            max: "6",
            lifetime: "3600",
            restock: "60",
          };
        }
        if (ev.name === "HeliCrash" || ev.name === "Wreck_UH1Y" || ev.name === "Wreck_Mi8") {
          return {
            ...ev,
            active: "1",
            nominal: "5",
            min: "3",
            max: "8",
            lifetime: "2400",
            restock: "60",
          };
        }
        if (ev.name === "TrainWreck") {
          return {
            ...ev,
            active: "1",
            nominal: "5",
            min: "3",
            max: "7",
            lifetime: "3600",
            restock: "60",
          };
        }
        return ev;
      }),
    );
    setDirty(true);
    toast.success("Preset aplicado: Mais Comboios Policiais/Militares e Helicrashes frequentes!");
  };

  const applyPresetMoreVehicles = () => {
    setEvents((curr) =>
      curr.map((ev) => {
        if (ev.name.startsWith("Vehicle")) {
          return { ...ev, active: "1", nominal: "8", min: "4", max: "12", restock: "60" };
        }
        return ev;
      }),
    );
    setDirty(true);
    toast.success("Preset aplicado: Servidor com veículos abundantes em toda Chernarus!");
  };

  const applyPresetToggleGas = (enable: boolean) => {
    setEvents((curr) =>
      curr.map((ev) => {
        if (ev.name === "DynamicContaminatedArea") {
          return { ...ev, active: enable ? "1" : "0" };
        }
        return ev;
      }),
    );
    setDirty(true);
    toast.success(
      enable ? "Gás tóxico de artilharia ATIVADO!" : "Gás tóxico de artilharia DESATIVADO!",
    );
  };

  const addCustomEvent = () => {
    const name = prompt("Nome do evento (ex: PoliceConvoy ou Event_Custom):");
    if (!name) return;
    const newEvent: DayzEvent = {
      name,
      nominal: "3",
      min: "1",
      max: "5",
      lifetime: "3600",
      restock: "0",
      saferadius: "500",
      distanceradius: "500",
      cleanupradius: "100",
      position: "fixed",
      limit: "custom",
      active: "1",
      flags: { deletable: "0", init_random: "0", remove_damaged: "1" },
    };
    setEvents((curr) => [newEvent, ...curr]);
    setQ(name);
    setDirty(true);
    toast.success(`Evento "${name}" adicionado!`);
  };

  const filteredEvents = useMemo(() => {
    const query = q.toLowerCase().trim();
    return events.filter((ev) => {
      const meta = EVENT_METADATA[ev.name];
      const matchQ =
        !query ||
        ev.name.toLowerCase().includes(query) ||
        (meta &&
          (meta.title.toLowerCase().includes(query) || meta.desc.toLowerCase().includes(query)));

      const cat =
        meta?.category ??
        (ev.name.startsWith("Vehicle")
          ? "vehicles"
          : ev.name.startsWith("Animal")
            ? "animals"
            : ev.name.startsWith("Infected")
              ? "infected"
              : "other");
      const matchCat = filterCat === "all" || cat === filterCat;

      return matchQ && matchCat;
    });
  }, [events, q, filterCat]);

  if (!f.text)
    return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="panel space-y-2 p-5 bg-gradient-to-r from-card via-card to-primary/10 border-primary/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-primary font-display flex items-center gap-2">
              <span>🚓</span> Editor de Eventos do DayZ (events.xml)
            </h2>
            <p className="text-sm text-foreground/90 max-w-2xl">
              Configure <strong>Comboio Policial (Police Convoy)</strong>,{" "}
              <strong>Comboio Militar</strong>,{" "}
              <strong>Quedas de Helicóptero (Heli Crashes)</strong>,{" "}
              <strong>Descarrilamento de Trens</strong>, <strong>Veículos</strong> e{" "}
              <strong>Zonas de Gás Tóxico</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary shadow-lg shadow-primary/20"
              disabled={!dirty || f.saving}
              onClick={save}
            >
              {f.saving ? "Salvando no Servidor…" : dirty ? "💾 Salvar events.xml" : "Salvo"}
            </button>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground flex flex-wrap gap-4 border-t border-border/40">
          <span>
            📁 Arquivo: <strong>db/events.xml</strong>
          </span>
          <span>
            ⚡ Aplicação: Reinicie o servidor após salvar para aplicar a nova frequência de eventos
          </span>
        </div>
      </div>

      {/* Barra de Presets Rápidos */}
      <div className="panel p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ⚡ Presets Rápidos de Configuração de Eventos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            className="flex flex-col text-left p-3 rounded-md border border-border bg-background/60 hover:border-primary/50 transition-colors"
            onClick={applyPresetMoreConvoys}
          >
            <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
              <span>🚨</span> Mais Comboios & Heli Crashes
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Aumenta comboios policiais, comboios militares e helicópteros com respawn rápido.
            </span>
          </button>

          <button
            className="flex flex-col text-left p-3 rounded-md border border-border bg-background/60 hover:border-primary/50 transition-colors"
            onClick={applyPresetMoreVehicles}
          >
            <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
              <span>🚗</span> Servidor com Muitos Carros
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Multiplica a quantidade de Humvees, Ada 4x4, sedans e caminhões pelo mapa.
            </span>
          </button>

          <button
            className="flex flex-col text-left p-3 rounded-md border border-border bg-background/60 hover:border-primary/50 transition-colors"
            onClick={() => applyPresetToggleGas(false)}
          >
            <span className="font-semibold text-xs text-amber-400 flex items-center gap-1.5">
              <span>🛑</span> Desativar Gás de Artilharia
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Desliga bombardeios de gás dinâmicos para não pegar jogadores de surpresa.
            </span>
          </button>

          <button
            className="flex flex-col text-left p-3 rounded-md border border-border bg-background/60 hover:border-primary/50 transition-colors"
            onClick={() => applyPresetToggleGas(true)}
          >
            <span className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
              <span>☣️</span> Ativar Gás Químico
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Liga artilharia química dinâmica sobre cidades aleatórias.
            </span>
          </button>
        </div>
      </div>

      {/* Filtros e Barra de Controle */}
      <div className="panel p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="field w-64 text-xs"
              placeholder="Buscar evento (ex: PoliceConvoy, Heli, Trem, Humvee)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className="field text-xs"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">Todas as Categorias</option>
              <option value="convoys">🚓 Comboios (Policial & Militar)</option>
              <option value="crashes">🚁 Helicópteros, Trens & Papai Noel</option>
              <option value="vehicles">🚙 Veículos & Carros</option>
              <option value="zones">☣️ Zonas de Gás Tóxico</option>
              <option value="animals">🐺 Animais Selvagens</option>
              <option value="infected">🧟 Infectados / Zumbis</option>
            </select>

            <span className="text-xs text-muted-foreground">
              {filteredEvents.length} de {events.length} eventos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-sm border border-border p-0.5 bg-background text-xs">
              <button
                className={`px-2.5 py-1 rounded-xs transition-colors ${
                  viewMode === "cards"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("cards")}
              >
                Cards
              </button>
              <button
                className={`px-2.5 py-1 rounded-xs transition-colors ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("table")}
              >
                Tabela
              </button>
            </div>

            <button className="btn-ghost text-xs h-8" onClick={addCustomEvent}>
              + Novo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Visualização em Cards ou Tabela */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const meta = EVENT_METADATA[ev.name] ?? {
              title: ev.name,
              desc: "Evento configurado no db/events.xml",
              icon: "📍",
              category: "other",
            };
            const isActive = ev.active === "1";
            const lifetimeMin = Math.round(Number(ev.lifetime || "0") / 60);

            return (
              <div
                key={ev.name}
                className={`panel p-4 space-y-3.5 border transition-all ${
                  isActive ? "border-primary/40 bg-card" : "border-border/60 bg-card/50 opacity-70"
                }`}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{meta.icon}</span>
                    <div className="min-w-0">
                      <h4 className="font-display text-lg text-primary truncate" title={meta.title}>
                        {meta.title}
                      </h4>
                      <p className="font-mono text-[10px] text-muted-foreground">{ev.name}</p>
                    </div>
                  </div>

                  {/* Toggle Ativo */}
                  <button
                    onClick={() => updateEvent(ev.name, { active: isActive ? "0" : "1" })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 border transition-colors ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-muted-foreground/60"}`}
                    />
                    {isActive ? "Ativo" : "Desativado"}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {meta.desc}
                </p>

                {/* Campos do Evento */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
                  {/* Quantidade Nominal */}
                  <div className="p-2 rounded-sm bg-secondary/50 border border-border/50">
                    <span
                      className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold"
                      title="Quantidade mantida no mapa"
                    >
                      No Mapa (Nominal)
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <input
                        className="cell font-mono text-sm font-bold text-primary w-12 p-0 h-6"
                        type="number"
                        value={ev.nominal}
                        onChange={(e) => updateEvent(ev.name, { nominal: e.target.value })}
                      />
                      <span className="text-[10px] text-muted-foreground">simultâneo</span>
                    </div>
                  </div>

                  {/* Mínimo e Máximo */}
                  <div className="p-2 rounded-sm bg-secondary/50 border border-border/50">
                    <span
                      className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold"
                      title="Mínimo e Máximo de eventos permitidos"
                    >
                      Mín / Máx
                    </span>
                    <div className="flex items-center gap-1 mt-1 font-mono text-xs">
                      <input
                        className="cell w-10 text-center p-0 h-6"
                        value={ev.min}
                        onChange={(e) => updateEvent(ev.name, { min: e.target.value })}
                        title="Mínimo"
                      />
                      <span className="text-muted-foreground">/</span>
                      <input
                        className="cell w-10 text-center p-0 h-6"
                        value={ev.max}
                        onChange={(e) => updateEvent(ev.name, { max: e.target.value })}
                        title="Máximo"
                      />
                    </div>
                  </div>

                  {/* Duração no mapa */}
                  <div className="p-2 rounded-sm bg-secondary/50 border border-border/50">
                    <span
                      className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold"
                      title="Tempo ativo antes de despawnar"
                    >
                      Duração (Lifetime)
                    </span>
                    <div className="flex items-center gap-1 mt-1 font-mono text-xs">
                      <input
                        className="cell w-16 p-0 h-6"
                        type="number"
                        value={ev.lifetime}
                        onChange={(e) => updateEvent(ev.name, { lifetime: e.target.value })}
                      />
                      <span
                        className="text-[10px] text-muted-foreground"
                        title={`${ev.lifetime}s = ${lifetimeMin} min`}
                      >
                        {lifetimeMin}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linha de configurações avançadas */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <span>Espera respawn:</span>
                    <input
                      className="cell w-12 text-center p-0 h-5 font-mono"
                      value={ev.restock}
                      onChange={(e) => updateEvent(ev.name, { restock: e.target.value })}
                      title="Segundos de espera antes de gerar outro"
                    />
                    <span>seg</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Raio seg:</span>
                    <input
                      className="cell w-12 text-center p-0 h-5 font-mono"
                      value={ev.saferadius}
                      onChange={(e) => updateEvent(ev.name, { saferadius: e.target.value })}
                      title="Raio de segurança em metros para evitar spawn perto do jogador"
                    />
                    <span>m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visão em Tabela */
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary font-display text-sm tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2">Status</th>
                <th className="p-2">Evento & Nome</th>
                <th className="p-2" title="Quantidade mantida no mapa">
                  Nominal ⓘ
                </th>
                <th className="p-2" title="Mínimo">
                  Mín ⓘ
                </th>
                <th className="p-2" title="Máximo">
                  Máx ⓘ
                </th>
                <th className="p-2" title="Tempo ativo antes de sumir em segundos">
                  Lifetime (s) ⓘ
                </th>
                <th className="p-2" title="Tempo de espera para repor">
                  Restock (s) ⓘ
                </th>
                <th className="p-2" title="Raio de segurança">
                  Saferadius ⓘ
                </th>
                <th className="p-2" title="Posição">
                  Posição ⓘ
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const meta = EVENT_METADATA[ev.name];
                const isActive = ev.active === "1";

                return (
                  <tr
                    key={ev.name}
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-2">
                      <button
                        onClick={() => updateEvent(ev.name, { active: isActive ? "0" : "1" })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {isActive ? "Ativo" : "Inativo"}
                      </button>
                    </td>

                    <td className="min-w-56 p-2">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{meta?.icon ?? "📍"}</span>
                        <span>{meta?.title ?? ev.name}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{ev.name}</div>
                    </td>

                    <td className="w-16 p-1">
                      <input
                        className="cell font-mono font-bold text-primary"
                        value={ev.nominal}
                        onChange={(e) => updateEvent(ev.name, { nominal: e.target.value })}
                      />
                    </td>

                    <td className="w-16 p-1">
                      <input
                        className="cell font-mono"
                        value={ev.min}
                        onChange={(e) => updateEvent(ev.name, { min: e.target.value })}
                      />
                    </td>

                    <td className="w-16 p-1">
                      <input
                        className="cell font-mono"
                        value={ev.max}
                        onChange={(e) => updateEvent(ev.name, { max: e.target.value })}
                      />
                    </td>

                    <td className="w-20 p-1">
                      <input
                        className="cell font-mono"
                        value={ev.lifetime}
                        onChange={(e) => updateEvent(ev.name, { lifetime: e.target.value })}
                      />
                    </td>

                    <td className="w-16 p-1">
                      <input
                        className="cell font-mono"
                        value={ev.restock}
                        onChange={(e) => updateEvent(ev.name, { restock: e.target.value })}
                      />
                    </td>

                    <td className="w-16 p-1">
                      <input
                        className="cell font-mono"
                        value={ev.saferadius}
                        onChange={(e) => updateEvent(ev.name, { saferadius: e.target.value })}
                      />
                    </td>

                    <td className="w-20 p-1 font-mono text-[11px] text-muted-foreground">
                      {ev.position}
                    </td>

                    <td className="p-1">
                      <button
                        className="text-destructive hover:bg-destructive/10 p-1 rounded-sm text-sm"
                        title="Remover evento"
                        onClick={() => {
                          setEvents((curr) => curr.filter((x) => x.name !== ev.name));
                          setDirty(true);
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
