import { useEffect, useState } from "react";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  Bomb,
  Hammer,
  Clock,
  Flame,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  loadBaseRaidConfig,
  saveBaseRaidConfig,
  applyBaseRaidToGameplayJson,
  type BaseRaidConfig,
} from "@/lib/pvp-raid-manager";

type J = Record<string, unknown> | unknown[] | string | number | boolean | null;

function Node({
  k,
  v,
  onChange,
  depth,
}: {
  k: string;
  v: J;
  onChange: (v: J) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1 || k === "StaminaData");
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return (
      <div className={depth ? "ml-3 border-l border-border pl-3" : ""}>
        <button
          className="py-1 font-display text-base tracking-wider text-primary"
          onClick={() => setOpen(!open)}
        >
          {open ? "▾" : "▸"} {k}
        </button>
        {open &&
          Object.entries(v).map(([ck, cv]) => (
            <Node
              key={ck}
              k={ck}
              v={cv}
              depth={depth + 1}
              onChange={(nv) => onChange({ ...v, [ck]: nv })}
            />
          ))}
      </div>
    );
  }
  return (
    <div className="ml-3 flex items-center gap-3 border-l border-border py-0.5 pl-3">
      <span className="w-72 truncate font-mono text-xs" title={k}>
        {k}
      </span>
      {typeof v === "boolean" ? (
        <button
          onClick={() => onChange(!v)}
          className={`btn h-6 ${v ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}
        >
          {v ? "Ativado" : "Desativado"}
        </button>
      ) : typeof v === "number" ? (
        <input
          className="field h-7 w-32 font-mono"
          type="number"
          step="any"
          value={v}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
      ) : typeof v === "string" ? (
        <input
          className="field h-7 w-80 font-mono"
          value={v}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <ArrayField v={v} onChange={onChange} />
      )}
    </div>
  );
}

function ArrayField({ v, onChange }: { v: J; onChange: (v: J) => void }) {
  const [t, setT] = useState(JSON.stringify(v));
  const [bad, setBad] = useState(false);
  return (
    <input
      className={`field h-7 w-[32rem] font-mono ${bad ? "border-destructive" : ""}`}
      value={t}
      onChange={(e) => {
        setT(e.target.value);
        try {
          onChange(JSON.parse(e.target.value));
          setBad(false);
        } catch {
          setBad(true);
        }
      }}
    />
  );
}

export function GameplayEditor({ s, onJson }: { s: Session; onJson?: (j: J) => void }) {
  const path = missionFile(s, "cfggameplay.json");
  const f = useRemoteFile(s, path);
  const [json, setJson] = useState<J>(null);
  const [dirty, setDirty] = useState(false);
  const [raw, setRaw] = useState(false);
  const [raidConfig, setRaidConfig] = useState<BaseRaidConfig>(() => loadBaseRaidConfig());

  useEffect(() => {
    if (f.text) {
      try {
        const j = JSON.parse(f.text);
        setJson(j);
        onJson?.(j);
        setDirty(false);

        // Verifica se o cfggameplay.json já possui configuração de dano em base
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bb = (j as any)?.BaseBuildingData;
        if (bb) {
          const isEnabled = bb.damageType !== 0 && bb.disableBaseDamage !== true;
          setRaidConfig((prev) => {
            const next = { ...prev, raidEnabled: isEnabled };
            saveBaseRaidConfig(next);
            return next;
          });
        }
      } catch {
        setRaw(true);
      }
    }
  }, [f.text, onJson]);

  const handleToggleRaid = (enabled: boolean) => {
    const nextConfig = { ...raidConfig, raidEnabled: enabled };
    setRaidConfig(nextConfig);
    saveBaseRaidConfig(nextConfig);

    const updatedJson = applyBaseRaidToGameplayJson(json, enabled);
    setJson(updatedJson);
    onJson?.(updatedJson);
    setDirty(true);

    if (enabled) {
      toast.success(
        "💥 Raid de Bases ATIVADO! Paredes e portões agora sofrem dano de armas e explosivos.",
      );
    } else {
      toast.info(
        "🛡️ Raid de Bases DESATIVADO! Paredes, cercas e portões estão 100% protegidos e invulneráveis.",
      );
    }
  };

  const handleUpdateSchedule = (sched: BaseRaidConfig["scheduleType"]) => {
    const nextConfig = { ...raidConfig, scheduleType: sched };
    setRaidConfig(nextConfig);
    saveBaseRaidConfig(nextConfig);
    setDirty(true);
    toast.success(
      `Agendamento de Raid alterado para: ${sched === "weekends_only" ? "Finais de Semana" : sched === "always_active" ? "24/7 Sempre Ativo" : sched === "night_hours" ? "Horário Noturno" : "Desativado"}`,
    );
  };

  const handleToggleTool = (
    tool: "allowExplosives" | "allowBullets" | "allowMeleeTools" | "allowHacksawLocks",
  ) => {
    const nextConfig = { ...raidConfig, [tool]: !raidConfig[tool] };
    setRaidConfig(nextConfig);
    saveBaseRaidConfig(nextConfig);
    setDirty(true);
  };

  if (!f.text)
    return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  return (
    <div className="space-y-4">
      {/* PAINEL ESPECIAL DE CONTROLE DE RAID & DANOS EM BASES */}
      <div
        className={`panel p-4 border transition-all ${
          raidConfig.raidEnabled
            ? "border-amber-500/60 bg-gradient-to-r from-amber-950/20 via-background to-card shadow-lg shadow-amber-950/20"
            : "border-emerald-500/60 bg-gradient-to-r from-emerald-950/20 via-background to-card shadow-lg shadow-emerald-950/20"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {raidConfig.raidEnabled ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500 text-amber-300 animate-pulse">
                  <Flame className="size-3.5 text-amber-400" />
                  Raid de Bases: Ativado (Com Danos)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500 text-emerald-300">
                  <Shield className="size-3.5 text-emerald-400" />
                  Raid de Bases: Desativado (Bases Protegidas)
                </div>
              )}
              <span className="text-[11px] text-muted-foreground font-mono">
                cfggameplay.json → BaseBuildingData
              </span>
            </div>

            <h2 className="text-xl font-display tracking-wide text-foreground">
              {raidConfig.raidEnabled
                ? "💥 Danos em Bases Permitidos (Raid Liberado)"
                : "🛡️ Bases Invulneráveis (Sem Danos / Raid Bloqueado)"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {raidConfig.raidEnabled
                ? "Jogadores podem atacar, quebrar e explodir portões, paredes de madeira/metal, cercas e arames farpados usando os métodos configurados abaixo."
                : "Paredes, cercas, torres e portões de base não sofrem NENHUM dano de tiros, explosivos ou marretas. Protege jogadores contra invasões indevidas."}
            </p>
          </div>

          {/* BOTÃO MESTRE DE ATIVAR / DESATIVAR RAID */}
          <div className="flex items-center gap-2 shrink-0">
            {raidConfig.raidEnabled ? (
              <button
                className="btn border border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs px-3.5 py-2 font-semibold shadow-md flex items-center gap-1.5 transition-all"
                onClick={() => handleToggleRaid(false)}
              >
                <Shield className="size-4 text-emerald-400" />
                Desativar Danos (Proteger Bases)
              </button>
            ) : (
              <button
                className="btn border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs px-3.5 py-2 font-semibold shadow-md flex items-center gap-1.5 transition-all"
                onClick={() => handleToggleRaid(true)}
              >
                <Bomb className="size-4 text-amber-400" />
                Ativar Danos em Bases (Liberar Raid)
              </button>
            )}
          </div>
        </div>

        {/* MÉTODOS DE RAID & AGENDAMENTO */}
        <div className="mt-4 pt-4 border-t border-border/50 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* Agendamento */}
          <div className="space-y-1.5 bg-secondary/20 p-2.5 rounded-sm border border-border/40">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="size-3.5 text-primary" /> Agendamento de Raid:
            </span>
            <div className="flex flex-col gap-1">
              {[
                { id: "weekends_only", label: "Finais de Semana (Sex-Dom)" },
                { id: "always_active", label: "24/7 Sempre Ativado" },
                { id: "night_hours", label: "Horário Noturno (20h-23h)" },
                { id: "disabled", label: "Desativado Permanente" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  className={`text-left px-2 py-1 rounded-xs transition-all ${
                    raidConfig.scheduleType === opt.id
                      ? "bg-primary/20 text-primary font-bold border border-primary/40"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  onClick={() => handleUpdateSchedule(opt.id as BaseRaidConfig["scheduleType"])}
                >
                  {raidConfig.scheduleType === opt.id ? "● " : "○ "}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Métodos de Destruição Permitidos */}
          <div className="space-y-1.5 bg-secondary/20 p-2.5 rounded-sm border border-border/40">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Bomb className="size-3.5 text-amber-400" /> Explosivos (C4 & Granadas):
            </span>
            <p className="text-[11px] text-muted-foreground">
              Explosivo Plástico C4, Granadas RDG-5 e M79 40mm causam dano estrutural.
            </p>
            <button
              className={`w-full py-1 rounded-xs text-xs font-semibold border transition-all ${
                raidConfig.allowExplosives
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-muted text-muted-foreground border-border"
              }`}
              onClick={() => handleToggleTool("allowExplosives")}
            >
              {raidConfig.allowExplosives ? "✓ Explosivos Permitidos" : "✕ Explosivos Bloqueados"}
            </button>
          </div>

          {/* Tiros e Balas de Armas de Fogo */}
          <div className="space-y-1.5 bg-secondary/20 p-2.5 rounded-sm border border-border/40">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Flame className="size-3.5 text-red-400" /> Tiros de Armas de Fogo:
            </span>
            <p className="text-[11px] text-muted-foreground">
              Balas de fuzil (.308, 7.62x54R, 12ga) gastam vida da parede.
            </p>
            <button
              className={`w-full py-1 rounded-xs text-xs font-semibold border transition-all ${
                raidConfig.allowBullets
                  ? "bg-red-500/20 text-red-300 border-red-500/50"
                  : "bg-muted text-muted-foreground border-border"
              }`}
              onClick={() => handleToggleTool("allowBullets")}
            >
              {raidConfig.allowBullets ? "✓ Balas Causam Dano" : "✕ Imune a Tiros (Recomendado)"}
            </button>
          </div>

          {/* Ferramentas Manuais & Cadeados */}
          <div className="space-y-1.5 bg-secondary/20 p-2.5 rounded-sm border border-border/40">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Hammer className="size-3.5 text-blue-400" /> Marreta & Serra de Cadeado:
            </span>
            <p className="text-[11px] text-muted-foreground">
              Cortar cadeados com serra ou bater em paredes com marreta/machado.
            </p>
            <button
              className={`w-full py-1 rounded-xs text-xs font-semibold border transition-all ${
                raidConfig.allowMeleeTools
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                  : "bg-muted text-muted-foreground border-border"
              }`}
              onClick={() => handleToggleTool("allowMeleeTools")}
            >
              {raidConfig.allowMeleeTools ? "✓ Marretas Permitidas" : "✕ Ferramentas Bloqueadas"}
            </button>
          </div>
        </div>
      </div>

      {/* TOOLBAR PADRÃO DE SALVAMENTO */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Dica: Em PlayerData → StaminaData ficam os ajustes de peso e estamina.
        </p>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setRaw(!raw)}>
            {raw ? "Modo Árvore" : "JSON Bruto"}
          </button>
          <button
            className="btn-primary"
            disabled={!dirty || f.saving}
            onClick={() => {
              f.save(JSON.stringify(json, null, 4));
              setDirty(false);
            }}
          >
            {f.saving ? "Salvando…" : "Salvar cfggameplay.json"}
          </button>
        </div>
      </div>

      <div className="panel p-4">
        {raw ? (
          <textarea
            className="h-[60vh] w-full bg-background p-2 font-mono text-xs outline-none"
            value={JSON.stringify(json, null, 4)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setJson(parsed);
                onJson?.(parsed);
                setDirty(true);
              } catch {
                /* espera JSON válido */
              }
            }}
          />
        ) : (
          json &&
          Object.entries(json).map(([k, v]) => (
            <Node
              key={k}
              k={k}
              v={v}
              depth={0}
              onChange={(nv) => {
                const j = { ...json, [k]: nv };
                setJson(j);
                onJson?.(j);
                setDirty(true);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
