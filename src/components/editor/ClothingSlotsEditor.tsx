import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  CLOTHING_DATABASE,
  type ClothingCategory,
  type ClothingItem,
} from "@/lib/clothing-slots-data";
import {
  Backpack,
  Shield,
  Shirt,
  Search,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Copy,
  FileCode,
  Check,
  ChevronRight,
  Info,
  Maximize2,
  TrendingUp,
} from "lucide-react";

const STORAGE_KEY = "dayz-custom-clothing-slots";

export function ClothingSlotsEditor() {
  // Mapa de id -> slots customizados
  const [customSlots, setCustomSlots] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | "all">("all");
  const [capacityFilter, setCapacityFilter] = useState<
    "all" | "huge" | "large" | "medium" | "small"
  >("all");
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customSlots));
  }, [customSlots]);

  // Função auxiliar para obter os slots efetivos (customizado ou vanilla)
  const getEffectiveSlots = useCallback(
    (item: ClothingItem): number => {
      return customSlots[item.id] !== undefined ? customSlots[item.id] : item.vanillaSlots;
    },
    [customSlots],
  );

  // Atualizar slot de um item
  const updateSlot = (itemId: string, newSlots: number) => {
    const clamped = Math.max(0, Math.min(300, Math.round(newSlots)));
    setCustomSlots((prev) => ({
      ...prev,
      [itemId]: clamped,
    }));
  };

  // Resetar slot de um item específico para o padrão Vanilla
  const resetSlot = (itemId: string) => {
    setCustomSlots((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    toast.success("Item restaurado para os slots padrão oficiais do DayZ!");
  };

  // Ajuste em lote
  const applyBatch = (type: "double" | "triple" | "backpacks50" | "clothes20" | "resetAll") => {
    if (type === "resetAll") {
      setCustomSlots({});
      toast.success("Todas as roupas foram restauradas para o padrão oficial Vanilla!");
      return;
    }

    setCustomSlots((prev) => {
      const next = { ...prev };
      CLOTHING_DATABASE.forEach((item) => {
        const current = next[item.id] !== undefined ? next[item.id] : item.vanillaSlots;
        if (type === "double") {
          next[item.id] = Math.min(300, current * 2);
        } else if (type === "triple") {
          next[item.id] = Math.min(300, current * 3);
        } else if (type === "backpacks50" && item.category === "backpacks") {
          next[item.id] = Math.min(300, current + 50);
        } else if (
          type === "clothes20" &&
          (item.category === "jackets" || item.category === "pants" || item.category === "vests")
        ) {
          next[item.id] = Math.min(300, current + 20);
        }
      });
      return next;
    });

    if (type === "double") toast.success("Slots de todas as roupas dobrados (2x)!");
    if (type === "triple") toast.success("Super Inventário aplicado (3x slots em tudo)!");
    if (type === "backpacks50") toast.success("+50 slots adicionados em todas as mochilas!");
    if (type === "clothes20") toast.success("+20 slots adicionados em jaquetas, calças e coletes!");
  };

  // Filtragem da lista
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();

    return CLOTHING_DATABASE.filter((item) => {
      // Categoria
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      // Capacidade
      const slots = getEffectiveSlots(item);
      if (capacityFilter === "huge" && slots < 70) return false;
      if (capacityFilter === "large" && (slots < 41 || slots >= 70)) return false;
      if (capacityFilter === "medium" && (slots < 20 || slots > 40)) return false;
      if (capacityFilter === "small" && slots >= 20) return false;

      // Busca por nome / classname / categoria
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }).sort((a, b) => getEffectiveSlots(b) - getEffectiveSlots(a));
  }, [search, selectedCategory, capacityFilter, getEffectiveSlots]);

  // Estatísticas do Inventário
  const stats = useMemo(() => {
    const count = CLOTHING_DATABASE.length;
    const modifiedCount = Object.keys(customSlots).length;

    // Achar as maiores peças de cada slot para calcular o "Sobrevivente Máximo"
    const maxBackpack = Math.max(
      ...CLOTHING_DATABASE.filter((i) => i.category === "backpacks").map(getEffectiveSlots),
    );
    const maxJacket = Math.max(
      ...CLOTHING_DATABASE.filter((i) => i.category === "jackets").map(getEffectiveSlots),
    );
    const maxPants = Math.max(
      ...CLOTHING_DATABASE.filter((i) => i.category === "pants").map(getEffectiveSlots),
    );
    const maxVest = Math.max(
      ...CLOTHING_DATABASE.filter((i) => i.category === "vests").map(getEffectiveSlots),
    );
    const maxBelt = Math.max(
      ...CLOTHING_DATABASE.filter((i) => i.category === "belts").map(getEffectiveSlots),
    );

    const totalLoadout = maxBackpack + maxJacket + maxPants + maxVest + maxBelt;

    // Vanilla correspondente
    const vanillaLoadout = 90 + 42 + 30 + 35 + 9; // 206 slots vanilla

    return {
      count,
      modifiedCount,
      maxBackpack,
      totalLoadout,
      vanillaLoadout,
      diffLoadout: totalLoadout - vanillaLoadout,
    };
  }, [customSlots, getEffectiveSlots]);

  // Exportar Tabela JSON
  const copyJson = () => {
    const output = CLOTHING_DATABASE.map((item) => ({
      classname: item.id,
      name: item.name,
      category: item.category,
      vanillaSlots: item.vanillaSlots,
      customSlots: getEffectiveSlots(item),
      grid: `${Math.ceil(getEffectiveSlots(item) / 10)}x10`,
    }));
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast.success("Tabela completa de slots copiada em JSON!");
  };

  // Exportar Script de Configuração para DayZ (mod/cfg)
  const copyScriptConfig = () => {
    let script = `// ========================================================\n`;
    script += `// Configuração de Slots de Inventário para DayZ Standalone\n`;
    script += `// Gerado pelo Fronteira Z Editor\n`;
    script += `// ========================================================\n\n`;
    script += `class CfgVehicles\n{\n`;

    CLOTHING_DATABASE.forEach((item) => {
      const slots = getEffectiveSlots(item);
      const rows = Math.max(1, Math.ceil(slots / 10));
      const cols = Math.min(10, slots);
      script += `\tclass ${item.id}\n\t{\n`;
      script += `\t\t// ${item.name} (Vanilla: ${item.vanillaSlots} slots)\n`;
      script += `\t\titemsCargoSize[] = {${cols}, ${rows}}; // Total: ${slots} slots\n`;
      script += `\t};\n`;
    });

    script += `};\n`;
    navigator.clipboard.writeText(script);
    toast.success("Script de configuração de slots DayZ (CfgVehicles) copiado!");
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Cabeçalho */}
      <div className="panel space-y-3 p-5 bg-gradient-to-r from-card via-card to-amber-500/10 border-amber-500/30 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Backpack className="size-5" />
              </span>
              <h2 className="text-2xl text-foreground font-display font-bold">
                Slots de Inventário de Roupas & Mochilas do DayZ
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Consulte a capacidade oficial de cada peça de roupa do DayZ Vanilla e ajuste a
              quantidade de slots de inventário (espaço de carga / cargo capacity) de qualquer
              mochila, colete, jaqueta, calça ou acessório para o seu servidor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-border/80 hover:bg-secondary"
              onClick={copyJson}
              title="Copiar tabela em JSON"
            >
              <Copy className="size-3.5 text-primary" />
              <span>Copiar JSON</span>
            </button>
            <button
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
              onClick={copyScriptConfig}
              title="Copiar CfgVehicles / Script de slots"
            >
              <FileCode className="size-3.5" />
              <span>Copiar CfgVehicles</span>
            </button>
          </div>
        </div>

        {/* Cards de Métricas e Capacidade do Sobrevivente */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-sm bg-background/60 p-2.5 border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Roupas Catalogadas
            </span>
            <span className="text-lg font-mono font-bold text-foreground">{stats.count} peças</span>
            <span className="text-[10px] text-amber-400 block mt-0.5">
              {stats.modifiedCount > 0 ? `${stats.modifiedCount} customizadas` : "Todas padrão"}
            </span>
          </div>

          <div className="rounded-sm bg-background/60 p-2.5 border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Maior Mochila (FieldBag)
            </span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {stats.maxBackpack} slots
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Vanilla: 90 slots (10x9)
            </span>
          </div>

          <div className="rounded-sm bg-background/60 p-2.5 border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Capacidade Máxima do Player
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-mono font-bold text-primary">
                {stats.totalLoadout} slots
              </span>
              {stats.diffLoadout !== 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-1 py-0.2 rounded-xs border ${
                    stats.diffLoadout > 0
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                      : "bg-red-950/80 text-red-300 border-red-700"
                  }`}
                >
                  {stats.diffLoadout > 0 ? `+${stats.diffLoadout}` : stats.diffLoadout}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Mochila + Jaqueta + Calça + Colete + Cinto
            </span>
          </div>

          <div className="rounded-sm bg-background/60 p-2.5 border border-border/60 flex flex-col justify-between">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Restauração Rápida
            </span>
            <button
              className="btn-ghost text-xs py-1 px-2 flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground border border-border/60 hover:bg-secondary mt-1"
              onClick={() => applyBatch("resetAll")}
              title="Restaurar todas as roupas para os slots oficiais da Bohemia"
            >
              <RotateCcw className="size-3" />
              Restaurar Vanilla
            </button>
          </div>
        </div>

        {/* Barra de Ações em Lote */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-sm bg-secondary/50 border border-border/60 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Multiplicadores Rápidos em Lote:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="btn-ghost text-xs px-2.5 py-1 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15 font-semibold"
              onClick={() => applyBatch("double")}
              title="Multiplicar por 2x a quantidade de slots de todas as roupas"
            >
              ⚡ Dobrar Slots (2x)
            </button>
            <button
              className="btn-ghost text-xs px-2.5 py-1 border border-primary/40 text-primary hover:bg-primary/15 font-semibold"
              onClick={() => applyBatch("triple")}
              title="Multiplicar por 3x a quantidade de slots de todas as roupas (Super Inventário)"
            >
              🚀 Super Inventário (3x)
            </button>
            <button
              className="btn-ghost text-xs px-2.5 py-1 border border-amber-500/40 text-amber-300 hover:bg-amber-500/15"
              onClick={() => applyBatch("backpacks50")}
              title="Adicionar +50 slots em todas as mochilas"
            >
              🎒 Mochilas +50 Slots
            </button>
            <button
              className="btn-ghost text-xs px-2.5 py-1 border border-border/60 hover:bg-secondary"
              onClick={() => applyBatch("clothes20")}
              title="Adicionar +20 slots em jaquetas, calças e coletes"
            >
              🦺 Roupas +20 Slots
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar de Filtros e Busca */}
      <div className="panel space-y-3 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome em português (ex: Mochila de Campo) ou classname (FieldBag)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field w-full pl-9 text-xs h-9"
            />
            {search && (
              <button
                className="btn-ghost absolute right-2 top-2 size-5 p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Faixa de Capacidade de Slots */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-sm border border-border/60 text-xs">
            <span className="text-[11px] text-muted-foreground px-1 font-semibold">Tamanho:</span>
            {[
              { id: "all", label: "Todas" },
              { id: "huge", label: "Gigantes (70+)" },
              { id: "large", label: "Grandes (41-69)" },
              { id: "medium", label: "Médias (20-40)" },
              { id: "small", label: "Pequenas (<20)" },
            ].map((f) => (
              <button
                key={f.id}
                className={`px-2 py-0.5 rounded-xs transition-colors ${
                  capacityFilter === f.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setCapacityFilter(f.id as typeof capacityFilter)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de Categorias */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
          {[
            { id: "all", label: "Todas as Roupas", icon: "🧥", count: CLOTHING_DATABASE.length },
            {
              id: "backpacks",
              label: "Mochilas",
              icon: "🎒",
              count: CLOTHING_DATABASE.filter((c) => c.category === "backpacks").length,
            },
            {
              id: "vests",
              label: "Coletes & Bolsas",
              icon: "🦺",
              count: CLOTHING_DATABASE.filter((c) => c.category === "vests").length,
            },
            {
              id: "jackets",
              label: "Jaquetas & Casacos",
              icon: "🧥",
              count: CLOTHING_DATABASE.filter((c) => c.category === "jackets").length,
            },
            {
              id: "pants",
              label: "Calças & Bermudas",
              icon: "👖",
              count: CLOTHING_DATABASE.filter((c) => c.category === "pants").length,
            },
            {
              id: "belts",
              label: "Cintos & Coldres",
              icon: "🥋",
              count: CLOTHING_DATABASE.filter((c) => c.category === "belts").length,
            },
            {
              id: "boots",
              label: "Botas & Sapatos",
              icon: "6",
              count: CLOTHING_DATABASE.filter((c) => c.category === "boots").length,
            },
            {
              id: "special",
              label: "Trajes Especiais (NBC/Ghillie)",
              icon: "☣️",
              count: CLOTHING_DATABASE.filter((c) => c.category === "special").length,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-xs"
                  : "bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
              }`}
              onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="text-[10px] font-mono opacity-80">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Roupas e Detalhes */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Tabela / Grid de Roupas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Exibindo {filteredItems.length} peças de vestuário:</span>
            <span>Clique em qualquer item para editar slots e detalhes</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const effectiveSlots = getEffectiveSlots(item);
              const isModified =
                customSlots[item.id] !== undefined && customSlots[item.id] !== item.vanillaSlots;
              const isSelected = selectedItem?.id === item.id;
              const diff = effectiveSlots - item.vanillaSlots;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-sm border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40"
                      : "bg-card hover:bg-secondary/40 border-border/70"
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{item.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-secondary border border-border/60 text-muted-foreground">
                          {item.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-primary/10 text-primary border border-primary/30">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Badge de Slots de Inventário */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-base font-mono font-bold text-amber-400">
                            {effectiveSlots} slots
                          </span>
                          {isModified && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs border ${
                                diff > 0
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                                  : "bg-red-950/80 text-red-300 border-red-700"
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          Padrão DayZ: {item.vanillaSlots} slots ({item.vanillaGrid})
                        </span>
                      </div>

                      <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
                    </div>
                  </div>

                  {/* Controles Rápidos de Slots na Linha */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-border/40 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground font-semibold mr-1">
                        Ajuste Rápido:
                      </span>
                      <button
                        className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                        onClick={() => updateSlot(item.id, effectiveSlots - 10)}
                        title="Diminuir 10 slots"
                      >
                        − 10
                      </button>
                      <button
                        className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-red-500/40 text-red-300 hover:bg-red-500/15"
                        onClick={() => updateSlot(item.id, effectiveSlots - 5)}
                        title="Diminuir 5 slots"
                      >
                        − 5
                      </button>
                      <button
                        className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                        onClick={() => updateSlot(item.id, effectiveSlots + 5)}
                        title="Aumentar 5 slots"
                      >
                        + 5
                      </button>
                      <button
                        className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                        onClick={() => updateSlot(item.id, effectiveSlots + 10)}
                        title="Aumentar 10 slots"
                      >
                        + 10
                      </button>
                      <button
                        className="btn-ghost h-6 px-1.5 text-[11px] font-bold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                        onClick={() => updateSlot(item.id, effectiveSlots + 25)}
                        title="Aumentar 25 slots"
                      >
                        + 25
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="300"
                          value={effectiveSlots}
                          onChange={(e) => updateSlot(item.id, +e.target.value)}
                          className="field w-16 h-6 text-center font-mono text-xs pr-4 font-bold bg-background"
                          title="Digite a quantidade exata de slots"
                        />
                        <span className="absolute right-1 text-[9px] text-muted-foreground pointer-events-none">
                          sl
                        </span>
                      </div>

                      {isModified && (
                        <button
                          className="btn-ghost h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 border border-border/60"
                          onClick={() => resetSlot(item.id)}
                          title={`Restaurar para ${item.vanillaSlots} slots`}
                        >
                          <RotateCcw className="size-2.5" />
                          Vanilla
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Lateral de Detalhes da Roupa Selecionada */}
        <aside className="space-y-4">
          {selectedItem ? (
            <div className="panel space-y-4 p-4 border-amber-500/50 bg-card shadow-md">
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-semibold bg-primary/20 text-primary border border-primary/40">
                      {selectedItem.categoryLabel}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-secondary text-muted-foreground border border-border/60">
                      {selectedItem.tier}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground mt-1">
                    {selectedItem.name}
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground block">
                    {selectedItem.id}
                  </span>
                </div>
                <button
                  className="btn-ghost size-7 p-0 text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => setSelectedItem(null)}
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedItem.description}
              </p>

              {/* Ajuste Completo de Slots com Slider */}
              <div className="space-y-3 p-3 rounded-sm bg-amber-500/10 border border-amber-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <SlidersHorizontal className="size-3.5" />
                    Espaço de Inventário (Slots):
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground bg-background/80 px-2 py-0.5 rounded-xs border border-amber-500/40">
                    {getEffectiveSlots(selectedItem)} slots
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>0 slots</span>
                    <span className="text-amber-400 font-semibold">
                      Vanilla: {selectedItem.vanillaSlots} slots
                    </span>
                    <span>200 slots</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={getEffectiveSlots(selectedItem)}
                    onChange={(e) => updateSlot(selectedItem.id, +e.target.value)}
                    className="w-full h-2 accent-amber-500 cursor-pointer bg-secondary rounded-lg"
                  />
                </div>

                {/* Botões Stepper */}
                <div className="flex flex-wrap gap-1">
                  {[-25, -10, -5, +5, +10, +25, +50].map((delta) => (
                    <button
                      key={delta}
                      className={`btn-ghost flex-1 h-7 text-xs font-bold border ${
                        delta < 0
                          ? "border-red-500/40 text-red-300 hover:bg-red-500/15"
                          : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                      }`}
                      onClick={() =>
                        updateSlot(selectedItem.id, getEffectiveSlots(selectedItem) + delta)
                      }
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>

                {/* Presets Rápidos */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: "Vanilla", val: selectedItem.vanillaSlots },
                      { label: "50 sl", val: 50 },
                      { label: "80 sl", val: 80 },
                      { label: "100 sl", val: 100 },
                      { label: "150 sl", val: 150 },
                    ].map((pr) => (
                      <button
                        key={pr.label}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-xs border ${
                          getEffectiveSlots(selectedItem) === pr.val
                            ? "bg-amber-500 text-black font-bold border-amber-400"
                            : "bg-secondary/70 text-muted-foreground border-border/60 hover:text-foreground"
                        }`}
                        onClick={() => updateSlot(selectedItem.id, pr.val)}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações de Anexos Especiais */}
              {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                <div className="p-2.5 rounded-sm bg-secondary/40 border border-border/60 text-xs space-y-1">
                  <span className="font-semibold text-foreground block">
                    Anexos e Suportes Especiais:
                  </span>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                    {selectedItem.attachments.map((att) => (
                      <li key={att}>{att}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bloco de Código XML / CfgVehicles do Item */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Configuração DayZ (CfgVehicles):
                </span>
                <pre className="p-2.5 rounded-sm bg-secondary/80 text-[11px] font-mono text-foreground border border-border/80 overflow-x-auto">
                  {`class ${selectedItem.id}
{
  itemsCargoSize[] = {${Math.min(10, getEffectiveSlots(selectedItem))}, ${Math.max(1, Math.ceil(getEffectiveSlots(selectedItem) / 10))}}; // ${getEffectiveSlots(selectedItem)} slots
};`}
                </pre>
                <button
                  className="btn-ghost w-full text-xs py-1.5 flex items-center justify-center gap-1.5 border border-border/80 hover:bg-secondary"
                  onClick={() => {
                    const code = `class ${selectedItem.id}\n{\n  itemsCargoSize[] = {${Math.min(10, getEffectiveSlots(selectedItem))}, ${Math.max(1, Math.ceil(getEffectiveSlots(selectedItem) / 10))}};\n};`;
                    navigator.clipboard.writeText(code);
                    toast.success(`Configuração de ${selectedItem.name} copiada!`);
                  }}
                >
                  <Copy className="size-3 text-primary" />
                  Copiar Config deste Item
                </button>
              </div>
            </div>
          ) : (
            <div className="panel p-5 text-center space-y-3 border-dashed border-border/80">
              <Shirt className="size-8 text-muted-foreground/60 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-display text-base font-semibold text-foreground">
                  Nenhuma Roupa Selecionada
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Clique em qualquer mochila, jaqueta, calça ou colete na lista ao lado para ver
                  detalhes, comparar dimensões e customizar slots.
                </p>
              </div>
            </div>
          )}

          {/* Guia Informativo de Slots no DayZ */}
          <div className="panel p-4 space-y-2.5 text-xs border-border/60 bg-secondary/20">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Info className="size-4 text-primary" />
              <span>Como funcionam os Slots no DayZ:</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              No DayZ Standalone, o espaço de inventário de cada roupa é definido pela propriedade{" "}
              <code className="text-primary font-mono">
                itemsCargoSize[] = {"{colunas, linhas}"}
              </code>
              .
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
              <li>
                <strong>Mochila de Campo (FieldBag):</strong> 10x9 = 90 slots (a maior do jogo).
              </li>
              <li>
                <strong>Jaqueta de Caçador / M65:</strong> 7x6 = 42 slots (as jaquetas mais
                espaçosas).
              </li>
              <li>
                <strong>Calça Cargo / Caçador:</strong> 6x5 = 30 slots.
              </li>
              <li>
                <strong>Colete de Alta Capacidade:</strong> 7x5 = 35 slots.
              </li>
              <li>
                <strong>Bolsas de Plate Carrier:</strong> 6x4 = 24 slots.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
