import { useState } from "react";
import { toast } from "sonner";

const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copiado"); };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="panel space-y-2 p-4"><h3 className="font-display text-xl text-primary">{title}</h3>{children}</div>;
}

export function ToolsPanel() {
  const [accel, setAccel] = useState(6);
  const [night, setNight] = useState(4);
  const [item, setItem] = useState({ name: "AKM", nominal: 10, min: 5, lifetime: 14400, restock: 1800, cat: "weapons", usage: "Military", tier: "Tier3" });
  const [spawn, setSpawn] = useState({ type: "Wreck_UH1Y", x: 7500, y: 0, z: 7500, count: 3 });
  const [msg, setMsg] = useState({ text: "Reinício do servidor em 10 minutos!", repeat: 0, delay: 0, deadline: 0 });
  const [restart, setRestart] = useState(4);

  const dayMin = (24 * 60) / accel;
  const typeXml = `<type name="${item.name}">\n    <nominal>${item.nominal}</nominal>\n    <lifetime>${item.lifetime}</lifetime>\n    <restock>${item.restock}</restock>\n    <min>${item.min}</min>\n    <quantmin>-1</quantmin>\n    <quantmax>-1</quantmax>\n    <cost>100</cost>\n    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>\n    <category name="${item.cat}"/>\n    <usage name="${item.usage}"/>\n    <value name="${item.tier}"/>\n</type>`;
  const spawnXml = Array.from({ length: spawn.count }, (_, i) => `<pos x="${spawn.x + i * 25}" y="${spawn.y}" z="${spawn.z}" a="0"/>`).join("\n");
  const msgXml = `<message>\n    <deadline>${msg.deadline}</deadline>\n    <shutdown>0</shutdown>\n    <delay>${msg.delay}</delay>\n    <repeat>${msg.repeat}</repeat>\n    <onconnect>${msg.repeat ? 0 : 1}</onconnect>\n    <text>${msg.text}</text>\n</message>`;
  const n = (v: string) => Number(v) || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Calculadora de tempo">
        <label className="block text-xs">Aceleração do dia (serverTimeAcceleration): {accel}x
          <input type="range" min={1} max={24} value={accel} onChange={(e) => setAccel(+e.target.value)} className="w-full" /></label>
        <label className="block text-xs">Aceleração da noite (serverNightTimeAcceleration): {night}x
          <input type="range" min={1} max={64} value={night} onChange={(e) => setNight(+e.target.value)} className="w-full" /></label>
        <p className="text-sm">Um dia completo dura cerca de <b>{Math.round(dayMin)} min</b> reais. A noite passa {accel * night}x mais rápido que o tempo real.</p>
      </Card>

      <Card title="Horários de reinício">
        <label className="block text-xs">Reiniciar a cada {restart}h</label>
        <input type="range" min={1} max={12} value={restart} onChange={(e) => setRestart(+e.target.value)} className="w-full" />
        <p className="font-mono text-sm">{Array.from({ length: Math.floor(24 / restart) }, (_, i) => `${String(i * restart).padStart(2, "0")}:00`).join(" · ")}</p>
        <p className="text-xs text-muted-foreground">Configure esses horários no painel da Nitrado em "Restart".</p>
      </Card>

      <Card title="Gerador de item (types.xml)">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(["name", "cat", "usage", "tier"] as const).map((k) => <label key={k}>{k}<input className="field w-full" value={item[k]} onChange={(e) => setItem({ ...item, [k]: e.target.value })} /></label>)}
          {(["nominal", "min", "lifetime", "restock"] as const).map((k) => <label key={k}>{k}<input className="field w-full" type="number" value={item[k]} onChange={(e) => setItem({ ...item, [k]: n(e.target.value) })} /></label>)}
        </div>
        <pre className="max-h-48 overflow-auto rounded-sm bg-background p-2 text-xs">{typeXml}</pre>
        <button className="btn-ghost" onClick={() => copy(typeXml)}>Copiar XML</button>
      </Card>

      <Card title="Gerador de posições (eventos / spawn)">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {(["x", "y", "z", "count"] as const).map((k) => <label key={k}>{k}<input className="field w-full" type="number" value={spawn[k]} onChange={(e) => setSpawn({ ...spawn, [k]: n(e.target.value) })} /></label>)}
        </div>
        <pre className="max-h-48 overflow-auto rounded-sm bg-background p-2 text-xs">{spawnXml}</pre>
        <button className="btn-ghost" onClick={() => copy(spawnXml)}>Copiar XML</button>
        <p className="text-xs text-muted-foreground">Use em cfgeventspawns.xml ou cfgplayerspawnpoints.xml. Pegue as coordenadas na aba Mapa.</p>
      </Card>

      <Card title="Mensagens do servidor (messages.xml)">
        <input className="field w-full" value={msg.text} onChange={(e) => setMsg({ ...msg, text: e.target.value })} />
        <div className="grid grid-cols-3 gap-2 text-xs">
          {(["repeat", "delay", "deadline"] as const).map((k) => <label key={k}>{k} (min)<input className="field w-full" type="number" value={msg[k]} onChange={(e) => setMsg({ ...msg, [k]: n(e.target.value) })} /></label>)}
        </div>
        <pre className="max-h-48 overflow-auto rounded-sm bg-background p-2 text-xs">{msgXml}</pre>
        <button className="btn-ghost" onClick={() => copy(msgXml)}>Copiar XML</button>
      </Card>

      <Card title="Dicas rápidas">
        <ul className="list-disc space-y-1 pl-4 text-sm">
          <li><b>nominal</b>: quantidade alvo no mapa. <b>min</b>: quando cair abaixo, o servidor repõe.</li>
          <li><b>lifetime</b> em segundos: 3888000 = 45 dias (bases/barracas).</li>
          <li>Desligue <b>count_in_cargo</b> para itens não "sumirem" por estarem guardados.</li>
          <li>Pare o servidor antes de editar arquivos grandes e reinicie depois de salvar.</li>
        </ul>
      </Card>
    </div>
  );
}
