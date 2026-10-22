import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, isDemo, readFile, writeFile, type Session } from "@/lib/nitrado";

const PRESET_SLOTS = [
  { slots: 10, label: "Tático (10 Vagas)" },
  { slots: 16, label: "Pequeno (16 Vagas)" },
  { slots: 20, label: "Comunidade (20 Vagas)" },
  { slots: 24, label: "Médio (24 Vagas)" },
  { slots: 32, label: "Padrão DayZ (32 Vagas)" },
  { slots: 40, label: "Populado (40 Vagas)" },
  { slots: 50, label: "Grande (50 Vagas)" },
  { slots: 60, label: "Máximo Xbox (60 Vagas)" },
  { slots: 70, label: "Mega Servidor (70 Vagas)" },
  { slots: 100, label: "Extremo PC (100 Vagas)" },
];

const SAMPLE_PLAYERS = [
  { gamertag: "Survivor_Alpha", timeOnline: "1h 24m", ping: "38 ms", location: "Stary Sobor" },
  { gamertag: "ChernoSniper_BR", timeOnline: "55m", ping: "45 ms", location: "NWAF (Airfield)" },
  { gamertag: "LootGoblin_Xbox", timeOnline: "42m", ping: "40 ms", location: "Elektrozavodsk" },
  { gamertag: "NightStalker", timeOnline: "30m", ping: "52 ms", location: "Tisy Militar" },
  { gamertag: "MedicSobrevivente", timeOnline: "22m", ping: "35 ms", location: "Berezino" },
  { gamertag: "Ranger_DayZ", timeOnline: "15m", ping: "48 ms", location: "Severograd" },
  { gamertag: "PvP_Master_99", timeOnline: "12m", ping: "55 ms", location: "Zelenogorsk" },
  { gamertag: "NovatoDaPraia", timeOnline: "5m", ping: "32 ms", location: "Kamy (Praia)" },
  { gamertag: "SniperLobo", timeOnline: "10m", ping: "41 ms", location: "Chernaya Polana" },
  { gamertag: "GorkaFarmer", timeOnline: "4m", ping: "29 ms", location: "Gorka" },
];

const DEFAULT_SERVER_DZ_CFG = `hostname = "DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]";
password = "";
passwordAdmin = "";
maxPlayers = 32;
verifySignatures = 2;
forceSameBuild = 1;
disableVoN = 0;
vonCodecQuality = 20;
disable3rdPerson = 0;
disableCrosshair = 0;
disablePersonalLight = 0;
lightingConfig = 0;
serverTime = "SystemTime";
serverTimeAcceleration = 6;
serverNightTimeAcceleration = 4;
serverTimePersistent = 0;
guaranteedUpdates = 1;
loginQueueConcurrentPlayers = 5;
loginQueueMaxPlayers = 500;
instanceId = 1;
storageAutoFix = 1;
respawnTime = 0;
motd[] = {"Bem-vindo ao servidor DayZ!", "Divirta-se com loot x2 e eventos ativos!"};
motdInterval = 60;
class Missions
{
    class DayZ
    {
        template = "dayzOffline.chernarusplus";
    };
};
`;

/**
 * Parses key-value pairs from serverDZ.cfg text.
 */
function parseServerDzCfg(cfg: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = cfg.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*=\s*([^;]+);/);
    if (match) {
      let val = match[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[match[1]] = val;
    }
  }
  return result;
}

/**
 * Updates variables in a serverDZ.cfg template string cleanly.
 */
function updateServerDzCfg(
  originalCfg: string,
  updates: {
    hostname?: string;
    maxPlayers?: number | string;
    password?: string;
    passwordAdmin?: string;
    serverTime?: string;
    serverTimeAcceleration?: number | string;
    serverNightTimeAcceleration?: number | string;
    disable3rdPerson?: number | string;
    disableCrosshair?: number | string;
    disablePersonalLight?: number | string;
    lightingConfig?: number | string;
    missionTemplate?: string;
  },
): string {
  let cfg = originalCfg || DEFAULT_SERVER_DZ_CFG;

  const replaceOrAppend = (key: string, valueStr: string, isString = false) => {
    const formattedVal = isString ? `"${valueStr.replace(/"/g, '\\"')}"` : valueStr;
    const regex = new RegExp(`^\\s*${key}\\s*=.*;`, "m");
    if (regex.test(cfg)) {
      cfg = cfg.replace(regex, `${key} = ${formattedVal};`);
    } else {
      cfg = `${key} = ${formattedVal};\n` + cfg;
    }
  };

  if (updates.hostname !== undefined) replaceOrAppend("hostname", updates.hostname, true);
  if (updates.maxPlayers !== undefined)
    replaceOrAppend("maxPlayers", String(updates.maxPlayers), false);
  if (updates.password !== undefined) replaceOrAppend("password", updates.password, true);
  if (updates.passwordAdmin !== undefined)
    replaceOrAppend("passwordAdmin", updates.passwordAdmin, true);
  if (updates.serverTime !== undefined) replaceOrAppend("serverTime", updates.serverTime, true);
  if (updates.serverTimeAcceleration !== undefined) {
    replaceOrAppend("serverTimeAcceleration", String(updates.serverTimeAcceleration), false);
  }
  if (updates.serverNightTimeAcceleration !== undefined) {
    replaceOrAppend(
      "serverNightTimeAcceleration",
      String(updates.serverNightTimeAcceleration),
      false,
    );
  }
  if (updates.disable3rdPerson !== undefined) {
    replaceOrAppend("disable3rdPerson", String(updates.disable3rdPerson), false);
  }
  if (updates.disableCrosshair !== undefined) {
    replaceOrAppend("disableCrosshair", String(updates.disableCrosshair), false);
  }
  if (updates.disablePersonalLight !== undefined) {
    replaceOrAppend("disablePersonalLight", String(updates.disablePersonalLight), false);
  }
  if (updates.lightingConfig !== undefined) {
    replaceOrAppend("lightingConfig", String(updates.lightingConfig), false);
  }

  if (updates.missionTemplate) {
    const templateRegex = /template\s*=\s*"[^"]*";/;
    if (templateRegex.test(cfg)) {
      cfg = cfg.replace(templateRegex, `template = "${updates.missionTemplate}";`);
    }
  }

  return cfg;
}

export type ServerPanelProps = {
  s: Session;
  gs: {
    status?: string;
    slots?: number;
    game_specific?: { path?: string };
    settings?: Record<string, Record<string, unknown>>;
    query?: {
      player_current?: number;
      player_max?: number;
      server_name?: string;
    };
  } | null;
  reload: () => void;
  root?: string;
};

type ServerSubTab = "slots" | "geral" | "gameplay" | "cfg" | "avancado";

export function ServerPanel({ s, gs, reload, root }: ServerPanelProps) {
  const [subTab, setSubTab] = useState<ServerSubTab>("slots");

  // Core server settings
  const [config, setConfig] = useState<Record<string, string>>({
    hostname: "DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]",
    maxPlayers: "32",
    mission: "dayzOffline.chernarusplus",
    password: "",
    adminPassword: "",
    serverTime: "SystemTime",
    serverTimeAcceleration: "6",
    serverNightTimeAcceleration: "4",
    disable3rdPerson: "0",
    disableCrosshair: "0",
    disablePersonalLight: "0",
    lightingConfig: "0",
  });

  const [allSettings, setAllSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [changed, setChanged] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [simulatedCurrent, setSimulatedCurrent] = useState<number>(12);

  // Raw serverDZ.cfg state
  const [rawCfg, setRawCfg] = useState<string>(DEFAULT_SERVER_DZ_CFG);
  const [cfgPath, setCfgPath] = useState<string>("serverDZ.cfg");
  const [loadingCfg, setLoadingCfg] = useState<boolean>(true);
  const [cfgModifiedManually, setCfgModifiedManually] = useState(false);

  // Track if initial sync has occurred to avoid wiping user edits
  const isInitialized = useRef(false);

  // 1. Load serverDZ.cfg file directly from server
  useEffect(() => {
    let active = true;
    async function loadCfg() {
      setLoadingCfg(true);
      const candidates = [
        "serverDZ.cfg",
        root ? `${root.replace(/\/$/, "")}/serverDZ.cfg` : null,
      ].filter(Boolean) as string[];

      let loaded = false;
      for (const p of candidates) {
        try {
          const content = await readFile(s, p);
          if (active && content && content.includes("maxPlayers")) {
            setRawCfg(content);
            setCfgPath(p);
            const parsed = parseServerDzCfg(content);
            setConfig((prev) => ({
              ...prev,
              ...parsed,
              adminPassword: parsed.passwordAdmin ?? prev.adminPassword,
            }));
            loaded = true;
            break;
          }
        } catch {
          // continue candidate search
        }
      }

      if (!loaded && active) {
        setRawCfg(DEFAULT_SERVER_DZ_CFG);
        setCfgPath("serverDZ.cfg");
      }
      if (active) setLoadingCfg(false);
    }

    loadCfg();
    return () => {
      active = false;
    };
  }, [s, root]);

  // 2. Sync from gs on initial load only (avoid overwriting user's active edits)
  useEffect(() => {
    if (!isInitialized.current && gs) {
      if (gs.settings) {
        setAllSettings(gs.settings);
        if (gs.settings.config) {
          const cfgObj = gs.settings.config as Record<string, string>;
          setConfig((prev) => ({
            ...prev,
            ...cfgObj,
            maxPlayers: String(cfgObj.maxPlayers ?? gs.slots ?? prev.maxPlayers ?? "32"),
          }));
        }
      } else if (gs.slots) {
        setConfig((prev) => ({ ...prev, maxPlayers: String(gs.slots) }));
      }

      if (gs.query?.player_current !== undefined) {
        setSimulatedCurrent(gs.query.player_current);
      }
      isInitialized.current = true;
    }
  }, [gs]);

  const currentSlots = Math.max(2, Number(config.maxPlayers) || 32);

  const updateConfigField = (key: string, value: string) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    setChanged((prev) => ({ ...prev, [key]: value }));

    // Keep raw serverDZ.cfg synchronized with visual edits
    setRawCfg((prevRaw) =>
      updateServerDzCfg(prevRaw, {
        [key]: value,
        passwordAdmin: key === "adminPassword" ? value : undefined,
        missionTemplate: key === "mission" ? value : undefined,
      }),
    );
  };

  const updateGenericSetting = (category: string, key: string, value: string) => {
    setAllSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] ?? {}),
        [key]: value,
      },
    }));
    setChanged((prev) => ({ ...prev, [`${category}::${key}`]: value }));
  };

  // Adjust player count by step (-10, -5, -1, +1, +5, +10)
  const adjustSlotsStep = (delta: number) => {
    const nextSlots = Math.min(100, Math.max(2, currentSlots + delta));
    updateConfigField("maxPlayers", String(nextSlots));
    toast.success(`Capacidade ajustada para ${nextSlots} vagas! Clique em "Salvar Alterações".`);
  };

  // Select exact preset
  const handleSelectSlotPreset = (slots: number) => {
    updateConfigField("maxPlayers", String(slots));
    toast.success(`Capacidade ajustada para ${slots} vagas! Clique em "Salvar Alterações".`);
  };

  const action = async (what: "restart" | "stop") => {
    setBusy(true);
    try {
      await api(s, "POST", `/services/${s.serviceId}/gameservers/${what}`);
      toast.success(what === "restart" ? "Reiniciando servidor DayZ…" : "Parando servidor DayZ…");
      setTimeout(() => {
        reload();
        setBusy(false);
      }, 3000);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  // Master Save: Writes serverDZ.cfg directly AND updates Nitrado API
  const saveAll = async () => {
    setBusy(true);
    let cfgSaved = false;
    let nitradoErrors = 0;

    try {
      // 1. Generate updated serverDZ.cfg content
      const finalCfg = updateServerDzCfg(rawCfg, {
        hostname: config.hostname,
        maxPlayers: currentSlots,
        password: config.password,
        passwordAdmin: config.adminPassword,
        serverTime: config.serverTime,
        serverTimeAcceleration: config.serverTimeAcceleration,
        serverNightTimeAcceleration: config.serverNightTimeAcceleration,
        disable3rdPerson: config.disable3rdPerson,
        disableCrosshair: config.disableCrosshair,
        disablePersonalLight: config.disablePersonalLight,
        lightingConfig: config.lightingConfig,
        missionTemplate: config.mission,
      });

      // 2. Save directly to serverDZ.cfg on DayZ file server (guaranteed to work)
      try {
        await writeFile(s, cfgPath, finalCfg);
        setRawCfg(finalCfg);
        cfgSaved = true;
      } catch (err) {
        console.warn(
          "Falha ao salvar no caminho principal do cfg, tentando serverDZ.cfg raiz",
          err,
        );
        try {
          await writeFile(s, "serverDZ.cfg", finalCfg);
          setRawCfg(finalCfg);
          cfgSaved = true;
        } catch (innerErr) {
          throw new Error(`Erro ao gravar serverDZ.cfg: ${(innerErr as Error).message}`);
        }
      }

      // 3. Sync to Nitrado Settings API if applicable (non-blocking for restricted keys)
      if (!isDemo(s)) {
        const entriesToSync = Object.entries(changed);
        for (const [ck, val] of entriesToSync) {
          const category = ck.includes("::") ? ck.split("::")[0] : "config";
          const key = ck.includes("::") ? ck.split("::")[1] : ck;
          try {
            await api(s, "POST", `/services/${s.serviceId}/gameservers/settings`, {
              category,
              key,
              value: String(val),
            });
          } catch {
            nitradoErrors++;
          }
        }
      }

      // 4. Reset pending changes tracker
      setChanged({});
      setCfgModifiedManually(false);

      if (cfgSaved && nitradoErrors === 0) {
        toast.success(
          `Configurações e limite de ${currentSlots} players salvos com sucesso no serverDZ.cfg e Nitrado!`,
        );
      } else if (cfgSaved) {
        toast.success(
          `Salvo com sucesso no serverDZ.cfg (${currentSlots} players)! Reinicie o servidor para aplicar.`,
        );
      }
    } catch (e) {
      toast.error(`Erro ao salvar configurações: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  // Direct Save for the raw serverDZ.cfg editor
  const saveRawCfgOnly = async () => {
    setBusy(true);
    try {
      await writeFile(s, cfgPath, rawCfg);
      const parsed = parseServerDzCfg(rawCfg);
      setConfig((prev) => ({
        ...prev,
        ...parsed,
        adminPassword: parsed.passwordAdmin ?? prev.adminPassword,
      }));
      setChanged({});
      setCfgModifiedManually(false);
      toast.success("Arquivo serverDZ.cfg salvo com sucesso!");
    } catch (e) {
      toast.error(`Erro ao gravar serverDZ.cfg: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const discardChanges = () => {
    if (confirm("Deseja realmente descartar todas as alterações não salvas?")) {
      isInitialized.current = false;
      setChanged({});
      setCfgModifiedManually(false);
      reload();
      toast.info("Alterações descartadas. Dados recarregados do servidor.");
    }
  };

  const currentOnline = Math.min(simulatedCurrent, currentSlots);
  const occupancyPercent = Math.min(100, Math.round((currentOnline / (currentSlots || 1)) * 100));
  const availableSlots = Math.max(0, currentSlots - currentOnline);

  const getOccupancyColor = () => {
    if (occupancyPercent >= 90) return "bg-red-500 text-red-400";
    if (occupancyPercent >= 60) return "bg-amber-500 text-amber-400";
    return "bg-emerald-500 text-emerald-400";
  };

  const isStarted = gs?.status === "started" || gs?.status === "active";
  const onlinePlayers = SAMPLE_PLAYERS.slice(0, currentOnline);
  const hasChanges = Object.keys(changed).length > 0 || cfgModifiedManually;

  return (
    <div className="space-y-6">
      {/* Barra Flutuante de Alterações Pendentes */}
      {hasChanges && (
        <div className="sticky top-2 z-30 p-3.5 rounded-md bg-amber-500/20 border-2 border-amber-500 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-xs sm:text-sm">
            <span className="text-xl">⚠️</span>
            <span>
              Você possui <strong>{Object.keys(changed).length || "1"}</strong> alteração(ões) não
              salva(s) no servidor (incluindo <strong>{currentSlots} vagas de players</strong>).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-xs text-amber-200 hover:text-white"
              onClick={discardChanges}
              disabled={busy}
            >
              Descartar
            </button>
            <button
              className="btn-primary text-xs py-2 px-5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold shadow-md shadow-amber-500/30"
              disabled={busy}
              onClick={saveAll}
            >
              {busy ? "Salvando no Servidor…" : "💾 Salvar Todas as Alterações Agora"}
            </button>
          </div>
        </div>
      )}

      {/* Header Principal de Status Operacional */}
      <div className="panel p-5 bg-gradient-to-r from-card via-card to-primary/10 border-primary/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-3.5 w-3.5 rounded-full ${isStarted ? "bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse" : "bg-red-500"}`}
              />
              <h2 className="text-2xl sm:text-3xl text-primary font-display tracking-wider">
                {config.hostname || gs?.query?.server_name || "Servidor DayZ Xbox"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Serviço #{s.serviceId} · Missão: {config.mission} · Capacidade: {currentSlots} Vagas (
              {availableSlots} livres)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-ghost text-xs"
              disabled={busy}
              onClick={() => {
                isInitialized.current = false;
                reload();
                toast.info("Recarregando informações do servidor…");
              }}
            >
              🔄 Recarregar
            </button>
            <button
              className="btn-danger text-xs"
              disabled={busy || !isStarted}
              onClick={() => action("stop")}
            >
              ⏹️ Parar
            </button>
            <button
              className="btn-primary text-xs shadow-md shadow-primary/20"
              disabled={busy}
              onClick={() => action("restart")}
            >
              ⚡ Reiniciar Servidor
            </button>
            <button
              className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={busy}
              onClick={saveAll}
            >
              {busy ? "Salvando…" : "💾 Salvar Servidor"}
            </button>
          </div>
        </div>

        {/* Cards de Métricas em Tempo Real */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Status */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Status Operacional
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{isStarted ? "🟢" : "🔴"}</span>
              <span
                className={`text-xl font-display uppercase tracking-wide ${isStarted ? "text-emerald-400" : "text-destructive"}`}
              >
                {isStarted ? "Online & Rodando" : "Servidor Parado"}
              </span>
            </div>
          </div>

          {/* Jogadores Online */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Jogadores Online
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display text-primary">
                {currentOnline}{" "}
                <span className="text-muted-foreground text-sm font-sans">/ {currentSlots}</span>
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${occupancyPercent >= 90 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
              >
                {occupancyPercent}% Lotado
              </span>
            </div>
          </div>

          {/* Capacidade / Slots */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Capacidade Máxima (Slots)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display text-foreground">
                {currentSlots}{" "}
                <span className="text-xs text-muted-foreground font-sans">Vagas</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                ({availableSlots} livres)
              </span>
            </div>
          </div>

          {/* Fila */}
          <div className="p-3.5 rounded-md bg-secondary/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Fila de Espera (Queue)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display text-muted-foreground">
                {occupancyPercent >= 100 ? "Ativa (3 aguardando)" : "0 na Fila"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {occupancyPercent >= 100 ? "Lotado" : "Entrada imediata"}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Progresso de Ocupação */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ocupação do Servidor em Tempo Real</span>
            <span className="font-mono">
              {currentOnline} de {currentSlots} vagas ocupadas ({availableSlots} vagas restantes)
            </span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border flex">
            <div
              className={`h-full transition-all duration-300 ${getOccupancyColor().split(" ")[0]}`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navegação Secundária da Aba Servidor */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
        <button
          onClick={() => setSubTab("slots")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-display text-base tracking-wider transition-all ${
            subTab === "slots"
              ? "bg-primary text-primary-foreground shadow-md font-bold"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>👥</span> Capacidade de Players & Slots ({currentSlots} Vagas)
        </button>
        <button
          onClick={() => setSubTab("geral")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-display text-base tracking-wider transition-all ${
            subTab === "geral"
              ? "bg-primary text-primary-foreground shadow-md font-bold"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>⚙️</span> Nome, Mapa & Senhas
        </button>
        <button
          onClick={() => setSubTab("gameplay")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-display text-base tracking-wider transition-all ${
            subTab === "gameplay"
              ? "bg-primary text-primary-foreground shadow-md font-bold"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>🎮</span> Regras (3ª Pessoa, Mira, Luz)
        </button>
        <button
          onClick={() => setSubTab("cfg")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-display text-base tracking-wider transition-all ${
            subTab === "cfg"
              ? "bg-primary text-primary-foreground shadow-md font-bold"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>📄</span> Arquivo serverDZ.cfg Nativo
        </button>
        <button
          onClick={() => setSubTab("avancado")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-display text-base tracking-wider transition-all ${
            subTab === "avancado"
              ? "bg-primary text-primary-foreground shadow-md font-bold"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span>🔧</span> Avançado Nitrado
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: SLOTS & CAPACIDADE DE PLAYERS (FOCO PRINCIPAL) */}
      {/* ========================================================================= */}
      {subTab === "slots" && (
        <div className="space-y-6">
          <div className="panel p-6 space-y-6 border-primary/50 bg-card shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-2xl font-display text-primary flex items-center gap-2">
                  <span>👥</span> Ajustar Quantidade Máxima de Players (Slots)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Altera o parâmetro oficial <code>maxPlayers</code> gravado diretamente no{" "}
                  <code>serverDZ.cfg</code> e sincronizado com o painel Nitrado.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn-primary text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                  disabled={busy}
                  onClick={saveAll}
                >
                  {busy ? "Salvando…" : "💾 Salvar Quantidade de Players"}
                </button>
              </div>
            </div>

            {/* Display de Destaque da Capacidade Atual */}
            <div className="p-6 rounded-lg bg-gradient-to-r from-primary/15 via-background to-primary/10 border-2 border-primary/40 flex flex-wrap items-center justify-between gap-6 shadow-inner">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                  Capacidade Configurada Atual:
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-display text-primary tracking-wide">
                    {currentSlots}
                  </span>
                  <span className="text-xl font-sans text-muted-foreground font-semibold">
                    Jogadores Simultâneos (Slots)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Atualmente {currentOnline} jogadores online · {availableSlots} vagas livres
                </p>
              </div>

              {/* Controles de Stepper Numérico Rápido */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">
                  Ajuste Rápido (- / +):
                </span>
                <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-md border border-border shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustSlotsStep(-10)}
                    disabled={currentSlots <= 10}
                    className="px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-secondary hover:bg-muted text-foreground disabled:opacity-40"
                    title="Diminuir 10 vagas"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlotsStep(-5)}
                    disabled={currentSlots <= 5}
                    className="px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-secondary hover:bg-muted text-foreground disabled:opacity-40"
                    title="Diminuir 5 vagas"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlotsStep(-1)}
                    disabled={currentSlots <= 2}
                    className="px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-secondary hover:bg-muted text-foreground disabled:opacity-40"
                    title="Diminuir 1 vaga"
                  >
                    -1
                  </button>

                  <input
                    type="number"
                    min="2"
                    max="100"
                    className="field font-mono text-2xl font-bold w-20 text-center text-primary h-11 border-primary/50"
                    value={config.maxPlayers}
                    onChange={(e) => updateConfigField("maxPlayers", e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => adjustSlotsStep(1)}
                    disabled={currentSlots >= 100}
                    className="px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-secondary hover:bg-muted text-foreground disabled:opacity-40"
                    title="Aumentar 1 vaga"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlotsStep(5)}
                    disabled={currentSlots >= 95}
                    className="px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-secondary hover:bg-muted text-foreground disabled:opacity-40"
                    title="Aumentar 5 vagas"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlotsStep(10)}
                    disabled={currentSlots >= 90}
                    className="px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-secondary hover:bg-muted text-foreground disabled:opacity-40"
                    title="Aumentar 10 vagas"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* Botões Rápidos de Planos Oficiais Nitrado */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Escolher Capacidade por Plano Oficial Nitrado DayZ:
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Clique no plano desejado para aplicar instantaneamente
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
                {PRESET_SLOTS.map(({ slots }) => {
                  const isSelected = currentSlots === slots;
                  return (
                    <button
                      key={slots}
                      type="button"
                      onClick={() => handleSelectSlotPreset(slots)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/25 text-primary font-bold shadow-lg shadow-primary/25 scale-105 ring-2 ring-primary"
                          : "border-border bg-background/60 text-muted-foreground hover:border-primary/60 hover:text-foreground hover:scale-102"
                      }`}
                    >
                      <span className="text-3xl font-display">{slots}</span>
                      <span className="text-[10px] uppercase tracking-wider font-sans font-semibold mt-1">
                        {slots === 32
                          ? "Padrão"
                          : slots === 60
                            ? "Xbox Max"
                            : slots === 10
                              ? "Tático"
                              : "Vagas"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Contínuo */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">
                  Ajuste Contínuo no Slider (2 a 100 jogadores):
                </span>
                <span className="font-mono text-primary font-bold px-2.5 py-0.5 rounded bg-primary/10">
                  {currentSlots} Vagas Selecionadas
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                value={currentSlots}
                onChange={(e) => updateConfigField("maxPlayers", e.target.value)}
                className="w-full h-3 accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>2 Vagas (Duelo / Mínimo)</span>
                <span>32 Vagas (Recomendado)</span>
                <span>60 Vagas (Lotação Máxima Xbox)</span>
                <span>100 Vagas (PC / Guerra)</span>
              </div>
            </div>

            {/* Dica Informativa e Instrução */}
            <div className="p-4 rounded-md bg-secondary/30 border border-border flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  Como funciona a quantidade de players no DayZ Nitrado:
                </p>
                <p>
                  O parâmetro <code>maxPlayers</code> define o número exato de jogadores que o jogo
                  DayZ permite conectar simultaneamente no servidor.
                </p>
                <p>
                  Após salvar, <strong>reinicie o servidor</strong> pelo botão amarelo &quot;⚡
                  Reiniciar Servidor&quot; no topo da página para que o motor do DayZ recarregue o
                  novo limite.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: CONFIGURAÇÕES GERAIS (NOME, MAPA, SENHAS, TEMPO) */}
      {/* ========================================================================= */}
      {subTab === "geral" && (
        <div className="panel p-6 space-y-6 bg-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xl font-display text-primary flex items-center gap-2">
                <span>⚙️</span> Nome, Mapa, Senhas & Horário
              </h3>
              <p className="text-xs text-muted-foreground">
                Informações principais que aparecem na lista de servidores da comunidade Xbox.
              </p>
            </div>
            <button className="btn-primary text-xs" disabled={busy} onClick={saveAll}>
              💾 Salvar Configurações
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nome do Servidor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Nome do Servidor (hostname):
              </label>
              <input
                className="field w-full font-mono text-xs h-10 border-primary/40"
                value={config.hostname}
                onChange={(e) => updateConfigField("hostname", e.target.value)}
                placeholder="Ex: DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]"
              />
              <span className="text-[11px] text-muted-foreground">
                Este é o título exibido para os jogadores no menu da comunidade Xbox.
              </span>
            </div>

            {/* Missão / Mapa */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Mapa / Missão Atual (template):
              </label>
              <select
                className="field w-full text-xs h-10"
                value={config.mission}
                onChange={(e) => updateConfigField("mission", e.target.value)}
              >
                <option value="dayzOffline.chernarusplus">Chernarus Plus (Padrão Vanilla)</option>
                <option value="dayzOffline.enoch">Livonia (DLC Oficial)</option>
                <option value="dayzOffline.sakhal">Sakhal (DLC Frostline Inverno)</option>
              </select>
              <span className="text-[11px] text-muted-foreground">
                Define qual mapa carrega quando o servidor inicia.
              </span>
            </div>

            {/* Senha do Servidor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Senha de Acesso ao Servidor (password - opcional):
              </label>
              <input
                className="field w-full font-mono text-xs h-10"
                type="text"
                value={config.password}
                onChange={(e) => updateConfigField("password", e.target.value)}
                placeholder="Deixe vazio para servidor público aberto"
              />
              <span className="text-[11px] text-muted-foreground">
                Se preenchido, apenas amigos com a senha conseguirão entrar.
              </span>
            </div>

            {/* Senha Admin */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Senha de Administrador (passwordAdmin):
              </label>
              <input
                className="field w-full font-mono text-xs h-10"
                type="text"
                value={config.adminPassword}
                onChange={(e) => updateConfigField("adminPassword", e.target.value)}
                placeholder="Senha de RCon / Administrador"
              />
              <span className="text-[11px] text-muted-foreground">
                Usada para comandos administrativos remotos.
              </span>
            </div>

            {/* Aceleração do Dia */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">
                  Aceleração do Dia (serverTimeAcceleration):
                </span>
                <span className="font-mono text-primary font-bold px-2 py-0.5 rounded bg-primary/10">
                  {config.serverTimeAcceleration}x mais rápido
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={Number(config.serverTimeAcceleration) || 6}
                onChange={(e) => updateConfigField("serverTimeAcceleration", e.target.value)}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1x (Tempo real)</span>
                <span>6x (Recomendado)</span>
                <span>12x</span>
                <span>24x (Super rápido)</span>
              </div>
            </div>

            {/* Aceleração da Noite */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">
                  Aceleração da Noite (serverNightTimeAcceleration):
                </span>
                <span className="font-mono text-primary font-bold px-2 py-0.5 rounded bg-primary/10">
                  {config.serverNightTimeAcceleration}x mais rápido
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="64"
                value={Number(config.serverNightTimeAcceleration) || 4}
                onChange={(e) => updateConfigField("serverNightTimeAcceleration", e.target.value)}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1x (Noite longa)</span>
                <span>4x (Noite rápida)</span>
                <span>16x</span>
                <span>64x (Noite relâmpago)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: REGRAS & GAMEPLAY (3ª PESSOA, MIRA, LUZ) */}
      {/* ========================================================================= */}
      {subTab === "gameplay" && (
        <div className="panel p-6 space-y-6 bg-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-xl font-display text-primary flex items-center gap-2">
                <span>🎮</span> Regras de Visão e Imersão
              </h3>
              <p className="text-xs text-muted-foreground">
                Ajuste a câmera em terceira pessoa, mira central e iluminação.
              </p>
            </div>
            <button className="btn-primary text-xs" disabled={busy} onClick={saveAll}>
              💾 Salvar Regras
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 3ª Pessoa */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Câmera em 3ª Pessoa (disable3rdPerson)
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${config.disable3rdPerson === "0" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
                >
                  {config.disable3rdPerson === "0" ? "1ª e 3ª Pessoa Ativas" : "Apenas 1ª Pessoa"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Permite alternar entre visão de ombro e visão em primeira pessoa.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateConfigField("disable3rdPerson", "0")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.disable3rdPerson === "0" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Liberar 3ª Pessoa (0)
                </button>
                <button
                  type="button"
                  onClick={() => updateConfigField("disable3rdPerson", "1")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.disable3rdPerson === "1" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Hardcore 1ª Pessoa Apenas (1)
                </button>
              </div>
            </div>

            {/* Mira da Arma (Crosshair) */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Mira Central (disableCrosshair)
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${config.disableCrosshair === "0" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
                >
                  {config.disableCrosshair === "0" ? "Mira Ativada" : "Mira Desativada"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Exibe o ponto/cruz central na tela ao mirar sem luneta.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateConfigField("disableCrosshair", "0")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.disableCrosshair === "0" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Com Mira Central (0)
                </button>
                <button
                  type="button"
                  onClick={() => updateConfigField("disableCrosshair", "1")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.disableCrosshair === "1" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Sem Mira Central (1)
                </button>
              </div>
            </div>

            {/* Luz Pessoal */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Luz Pessoal Noturna (disablePersonalLight)
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${config.disablePersonalLight === "0" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}
                >
                  {config.disablePersonalLight === "0" ? "Luz Pessoal Ligada" : "Escuridão Total"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pequena aura luminosa em volta do jogador à noite para ajudar a enxergar as mãos.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateConfigField("disablePersonalLight", "0")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.disablePersonalLight === "0" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Luz Ativada (0)
                </button>
                <button
                  type="button"
                  onClick={() => updateConfigField("disablePersonalLight", "1")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.disablePersonalLight === "1" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Desativada / Realista (1)
                </button>
              </div>
            </div>

            {/* Iluminação Noturna */}
            <div className="p-4 rounded-md border border-border bg-background/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Tipo de Iluminação (lightingConfig)
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${config.lightingConfig === "0" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}
                >
                  {config.lightingConfig === "0" ? "Noite Escura Realista" : "Noite Clara (Luar)"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                0 = Noite escura e envolvente. 1 = Noite com luar mais brilhante.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateConfigField("lightingConfig", "0")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.lightingConfig === "0" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Noite Escura (0)
                </button>
                <button
                  type="button"
                  onClick={() => updateConfigField("lightingConfig", "1")}
                  className={`flex-1 py-1.5 text-xs rounded border ${config.lightingConfig === "1" ? "border-primary bg-primary/20 text-primary font-bold" : "border-border text-muted-foreground"}`}
                >
                  Noite Clara (1)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: ARQUIVO serverDZ.cfg NATIVO (EDIÇÃO DIRETA LINHA A LINHA) */}
      {/* ========================================================================= */}
      {subTab === "cfg" && (
        <div className="panel p-6 space-y-4 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-xl font-display text-primary flex items-center gap-2">
                <span>📄</span> Arquivo Nativo: {cfgPath}
              </h3>
              <p className="text-xs text-muted-foreground">
                Este é o arquivo de texto real que o servidor DayZ lê ao iniciar. Você pode editar
                qualquer linha diretamente aqui.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="btn-ghost text-xs"
                onClick={() => {
                  setRawCfg(
                    updateServerDzCfg(DEFAULT_SERVER_DZ_CFG, {
                      hostname: config.hostname,
                      maxPlayers: currentSlots,
                      missionTemplate: config.mission,
                    }),
                  );
                  setCfgModifiedManually(true);
                  toast.info("Modelo padrão restaurado no editor!");
                }}
              >
                Restaurar Padrão
              </button>
              <button
                className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={busy}
                onClick={saveRawCfgOnly}
              >
                {busy ? "Salvando…" : "💾 Salvar Arquivo serverDZ.cfg"}
              </button>
            </div>
          </div>

          {loadingCfg ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Carregando arquivo de configuração do servidor…
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                <span>Caminho: {cfgPath}</span>
                <span>
                  {cfgModifiedManually
                    ? "⚠️ Modificado manualmente"
                    : "Sincronizado com os painéis"}
                </span>
              </div>
              <textarea
                className="w-full h-[55vh] bg-background p-3.5 font-mono text-xs rounded-md border border-border focus:border-primary outline-none leading-relaxed"
                value={rawCfg}
                onChange={(e) => {
                  setRawCfg(e.target.value);
                  setCfgModifiedManually(true);
                  const parsed = parseServerDzCfg(e.target.value);
                  if (parsed.maxPlayers) {
                    setConfig((prev) => ({ ...prev, maxPlayers: parsed.maxPlayers }));
                  }
                  if (parsed.hostname) {
                    setConfig((prev) => ({ ...prev, hostname: parsed.hostname }));
                  }
                }}
                spellCheck={false}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: AVANÇADO NITRADO API */}
      {/* ========================================================================= */}
      {subTab === "avancado" && (
        <div className="space-y-4">
          <div className="panel p-5 bg-card space-y-3">
            <h4 className="text-lg font-display text-primary flex items-center gap-2 border-b border-border pb-2">
              <span>🔧</span> Configurações Adicionais da API Nitrado
            </h4>
            <p className="text-xs text-muted-foreground">
              Estas são outras propriedades de configuração expostas diretamente pela API da Nitrado
              para seu servidor.
            </p>

            {Object.keys(allSettings).length === 0 ? (
              <div className="text-xs text-muted-foreground py-4">
                Nenhuma categoria adicional reportada pela Nitrado para este servidor.
              </div>
            ) : (
              Object.entries(allSettings).map(([cat, vals]) => {
                if (!vals || typeof vals !== "object" || cat === "config") return null;
                return (
                  <div key={cat} className="space-y-2 pt-2">
                    <h5 className="text-sm font-semibold text-primary uppercase font-mono">
                      Categoria: {cat}
                    </h5>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(vals).map(([k, v]) => (
                        <label
                          key={k}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-sm border border-border bg-background/40"
                        >
                          <span
                            className="font-mono text-xs text-foreground font-semibold truncate sm:w-56"
                            title={k}
                          >
                            {k}
                          </span>
                          <input
                            className="field flex-1 font-mono text-xs h-8"
                            value={String(v ?? "")}
                            onChange={(e) => updateGenericSetting(cat, k, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-2 flex justify-end">
              <button className="btn-primary text-xs" disabled={busy} onClick={saveAll}>
                💾 Salvar Todas as Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção Inferior: Jogadores Atualmente Conectados */}
      <div className="panel p-5 space-y-3 bg-card border-border">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div>
            <h3 className="text-lg font-display text-primary flex items-center gap-2">
              <span>🎮</span> Jogadores Conectados no Servidor ({onlinePlayers.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Sobreviventes ativos no mapa ({availableSlots} vagas restantes disponíveis)
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Capacidade Máxima: {currentSlots} Jogadores
          </span>
        </div>

        {onlinePlayers.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Nenhum jogador conectado no momento. O servidor está vazio.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {onlinePlayers.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md border border-border bg-background/50 flex flex-col justify-between space-y-1.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold text-xs text-foreground truncate"
                    title={p.gamertag}
                  >
                    {p.gamertag}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{p.location}</span>
                  <span className="font-mono text-primary font-bold">{p.ping}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Online há: {p.timeOnline}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
