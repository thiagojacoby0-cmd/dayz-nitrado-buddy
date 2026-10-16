import { useEffect, useState } from "react";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";

type J = any;

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
  useEffect(() => {
    if (f.text) {
      try {
        const j = JSON.parse(f.text);
        setJson(j);
        onJson?.(j);
        setDirty(false);
      } catch {
        setRaw(true);
      }
    }
  }, [f.text]);
  if (!f.text)
    return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Dica: em PlayerData → StaminaData ficam os ajustes de peso (staminaWeightLimitThreshold,
          staminaKgToStaminaPercentPenalty).
        </p>
        <button className="btn-ghost ml-auto" onClick={() => setRaw(!raw)}>
          {raw ? "Formulário" : "JSON bruto"}
        </button>
        <button
          className="btn-primary"
          disabled={!dirty || f.saving}
          onClick={() => f.save(JSON.stringify(json, null, 4))}
        >
          {f.saving ? "Salvando…" : "Salvar cfggameplay"}
        </button>
      </div>
      <div className="panel p-4">
        {raw ? (
          <textarea
            className="h-[60vh] w-full bg-background p-2 font-mono text-xs outline-none"
            defaultValue={JSON.stringify(json, null, 4)}
            onChange={(e) => {
              try {
                setJson(JSON.parse(e.target.value));
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
