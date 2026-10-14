import { useEffect, useMemo, useState } from "react";
import { ITEM_WEIGHTS } from "@/lib/weights";

const KEY = "dayz-weight-overrides";

export function WeightPanel({ gameplay }: { gameplay: any }) {
  const [over, setOver] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [load, setLoad] = useState<Record<string, number>>({});
  useEffect(() => { try { setOver(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* vazio */ } }, []);
  const saveOver = (o: Record<string, number>) => { setOver(o); localStorage.setItem(KEY, JSON.stringify(o)); };

  const w = (n: string): number => over[n] ?? ITEM_WEIGHTS[n] ?? 0;
  const list = useMemo(() => Object.keys(ITEM_WEIGHTS).filter((n) => n.toLowerCase().includes(q.toLowerCase())), [q]);
  const total = Object.entries(load).reduce((a, [n, c]) => a + w(n) * c, 0) / 1000;

  const st = gameplay?.PlayerData?.StaminaData ?? {};
  const threshold = st.staminaWeightLimitThreshold ?? 6000;
  const penalty = st.staminaKgToStaminaPercentPenalty ?? 1.75;
  const max = st.staminaMax ?? 100;
  const over_kg = Math.max(0, total - threshold / 1000);
  const staminaLeft = Math.max(st.staminaMinCap ?? 5, max - over_kg * penalty);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">No Xbox o peso de cada item é fixo pelo jogo. Aqui você vê e ajusta o peso por item para planejar, e o efeito real no servidor vem da stamina na aba Gameplay.</p>
        <input className="field w-64" placeholder="Buscar item…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="panel max-h-[65vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary font-display text-sm tracking-wider text-muted-foreground">
              <tr><th className="p-2 text-left">Item</th><th className="p-2 text-left">Peso (g)</th><th className="p-2" /></tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n} className="border-t border-border">
                  <td className="px-2 font-mono">{n}{over[n] !== undefined && <span className="ml-2 text-primary">editado</span>}</td>
                  <td className="w-32 px-1"><input className="cell" type="number" value={w(n)} onChange={(e) => saveOver({ ...over, [n]: Number(e.target.value) })} /></td>
                  <td className="w-24 px-1 text-right"><button className="btn-ghost h-6" onClick={() => setLoad({ ...load, [n]: (load[n] ?? 0) + 1 })}>+ Mochila</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="panel h-fit space-y-3 p-4">
        <h3 className="text-xl text-primary">Calculadora de carga</h3>
        {Object.keys(load).length === 0 && <p className="text-xs text-muted-foreground">Adicione itens para ver o impacto na stamina.</p>}
        {Object.entries(load).map(([n, c]) => (
          <div key={n} className="flex items-center justify-between font-mono text-xs">
            <span>{c}× {n}</span>
            <button className="text-destructive" onClick={() => { const l = { ...load }; if (c > 1) l[n] = c - 1; else delete l[n]; setLoad(l); }}>−</button>
          </div>
        ))}
        <div className="border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span>Peso total</span><b className="font-mono">{total.toFixed(2)} kg</b></div>
          <div className="flex justify-between"><span>Limite sem penalidade</span><span className="font-mono">{(threshold / 1000).toFixed(1)} kg</span></div>
          <div className="flex justify-between"><span>Stamina máxima</span><b className={`font-mono ${staminaLeft < max * 0.5 ? "text-destructive" : "text-success"}`}>{staminaLeft.toFixed(0)} / {max}</b></div>
        </div>
        {Object.keys(over).length > 0 && <button className="btn-ghost w-full justify-center" onClick={() => saveOver({})}>Restaurar pesos padrão</button>}
      </aside>
    </div>
  );
}
