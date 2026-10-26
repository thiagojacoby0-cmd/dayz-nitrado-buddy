import { useEffect, useMemo, useState } from "react";
import { missionFile, type Session } from "@/lib/nitrado";
import { FileState, useRemoteFile } from "./useFile";
import { getItemLabel } from "@/lib/demo-data";

// Editor do cfgrandompresets.xml: define o loot que cai dos zumbis (infectados).
// Cada <lootPresets name="..."> é um grupo usado pelos tipos de zumbi em types.xml
// (tag zombieMale/zombieFemale usam <value name="..."> ligado ao preset).

type LootItem = { name: string; chance: string; quantmin: string; quantmax: string };
type Preset = { name: string; items: LootItem[] };

function parse(xml: string): Preset[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return Array.from(doc.getElementsByTagName("lootPresets")).map((p) => ({
    name: p.getAttribute("name") ?? "",
    items: Array.from(p.getElementsByTagName("item")).map((i) => ({
      name: i.getAttribute("name") ?? "",
      chance: i.getAttribute("chance") ?? "1.0",
      quantmin: i.getAttribute("quantmin") ?? "-1",
      quantmax: i.getAttribute("quantmax") ?? "-1",
    })),
  }));
}

function serialize(presets: Preset[]) {
  const body = presets
    .map((p) => {
      const items = p.items
        .map(
          (i) =>
            `\t\t<item name="${i.name}" chance="${i.chance}"${i.quantmin !== "-1" ? ` quantmin="${i.quantmin}"` : ""}${i.quantmax !== "-1" ? ` quantmax="${i.quantmax}"` : ""}/>\n`,
        )
        .join("");
      return `\t<lootPresets name="${p.name}">\n${items}\t</lootPresets>\n`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n<randompresets>\n${body}</randompresets>\n`;
}

const PRESET_PT: Record<string, string> = {
  zombieCivilian: "Zumbis civis (cidades e vilas)",
  zombieSoldier: "Zumbis militares",
  zombiePolice: "Zumbis policiais",
  zombieMedic: "Zumbis médicos",
  zombieFirefighter: "Zumbis bombeiros",
  zombieIndustrial: "Zumbis industriais",
  zombieVillager: "Zumbis de vila",
  zombieHunter: "Zumbis caçadores",
  zombieNBC: "Zumbis NBC (zona contaminada)",
  zombiePrisoner: "Zumbis de prisão",
};

export function ZombieLootEditor({ s }: { s: Session }) {
  const path = missionFile(s, "cfgrandompresets.xml");
  const f = useRemoteFile(s, path);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (f.text) {
      setPresets(parse(f.text));
      setDirty(false);
    }
  }, [f.text]);

  const upd = (pi: number, ii: number, patch: Partial<LootItem>) => {
    setPresets((ps) =>
      ps.map((p, j) =>
        j === pi
          ? { ...p, items: p.items.map((it, k) => (k === ii ? { ...it, ...patch } : it)) }
          : p,
      ),
    );
    setDirty(true);
  };
  const addItem = (pi: number) => {
    const name = prompt("Nome da classe do item (ex: BandageDressing)");
    if (!name) return;
    setPresets((ps) =>
      ps.map((p, j) =>
        j === pi
          ? { ...p, items: [...p.items, { name, chance: "0.5", quantmin: "-1", quantmax: "-1" }] }
          : p,
      ),
    );
    setDirty(true);
  };
  const removeItem = (pi: number, ii: number) => {
    setPresets((ps) =>
      ps.map((p, j) => (j === pi ? { ...p, items: p.items.filter((_, k) => k !== ii) } : p)),
    );
    setDirty(true);
  };

  const list = useMemo(() => presets, [presets]);

  if (!f.text)
    return <FileState loading={f.loading} error={f.error} path={path} onRetry={f.load} />;

  return (
    <div className="space-y-3">
      <div className="panel space-y-1 p-4 text-sm">
        <p>
          Aqui você escolhe <strong>o que cai dos zumbis</strong> quando você os mata. Cada grupo
          abaixo é um tipo de zumbi; dentro dele ficam os itens e a <strong>chance</strong> de cada
          um aparecer.
        </p>
        <p className="text-xs text-muted-foreground">
          Chance vai de 0 a 1: 1.0 = sempre cai, 0.5 = metade das vezes, 0.1 = raro. Salve e
          reinicie o servidor para aplicar.
        </p>
      </div>
      <div className="flex justify-end">
        <button
          className="btn-primary"
          disabled={!dirty || f.saving}
          onClick={() => f.save(serialize(presets))}
        >
          {f.saving ? "Salvando…" : "Salvar loot dos zumbis"}
        </button>
      </div>
      {list.map((p, pi) => (
        <div key={p.name} className="panel p-4">
          <button
            className="flex w-full items-center gap-2 text-left"
            onClick={() => setOpen(open === p.name ? null : p.name)}
          >
            <span className="text-primary">{open === p.name ? "▾" : "▸"}</span>
            <h3 className="text-xl text-primary">{PRESET_PT[p.name] ?? p.name}</h3>
            <span className="ml-auto text-xs text-muted-foreground">{p.items.length} itens</span>
          </button>
          {open === p.name && (
            <div className="mt-3 space-y-1">
              <div className="grid grid-cols-[1fr_90px_90px_90px_24px] gap-2 text-xs font-semibold text-muted-foreground">
                <span>Item</span>
                <span title="0 a 1 — 1.0 sempre cai, 0.5 metade das vezes">Chance ⓘ</span>
                <span title="Carga mínima % (-1 = padrão)">Carga mín ⓘ</span>
                <span title="Carga máxima % (-1 = padrão)">Carga máx ⓘ</span>
                <span />
              </div>
              {p.items.map((it, ii) => (
                <div
                  key={ii}
                  className="grid grid-cols-[1fr_90px_90px_90px_24px] items-center gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span
                      className="truncate text-xs font-semibold text-foreground"
                      title={it.name}
                    >
                      {getItemLabel(it.name)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate">
                      {it.name}
                    </span>
                  </div>
                  <input
                    className="cell"
                    value={it.chance}
                    onChange={(e) => upd(pi, ii, { chance: e.target.value })}
                  />
                  <input
                    className="cell"
                    value={it.quantmin}
                    onChange={(e) => upd(pi, ii, { quantmin: e.target.value })}
                  />
                  <input
                    className="cell"
                    value={it.quantmax}
                    onChange={(e) => upd(pi, ii, { quantmax: e.target.value })}
                  />
                  <button
                    className="text-destructive"
                    title="Remover"
                    onClick={() => removeItem(pi, ii)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn-ghost mt-2 h-7 text-xs" onClick={() => addItem(pi)}>
                + Adicionar item
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
