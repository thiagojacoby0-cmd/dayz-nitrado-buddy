import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { readFile, writeFile, type Session } from "@/lib/nitrado";

export function useRemoteFile(s: Session, path: string) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setText(await readFile(s, path)); }
    catch (e) { setError((e as Error).message); setText(null); }
    finally { setLoading(false); }
  }, [s, path]);

  useEffect(() => { load(); }, [load]);

  const save = async (content: string) => {
    setSaving(true);
    try { await writeFile(s, path, content); setText(content); toast.success("Salvo no servidor. Reinicie para aplicar."); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };
  return { text, loading, saving, error, load, save };
}

export function FileState({ loading, error, path, onRetry }: { loading: boolean; error: string | null; path: string; onRetry: () => void }) {
  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando {path}…</p>;
  if (error) return (
    <div className="panel m-0 space-y-2 p-6 text-sm">
      <p className="text-destructive">Não foi possível abrir <span className="font-mono">{path}</span></p>
      <p className="font-mono text-xs text-muted-foreground">{error}</p>
      <p className="text-muted-foreground">Confira a pasta da missão no topo ou use a aba Arquivos.</p>
      <button className="btn-ghost" onClick={onRetry}>Tentar de novo</button>
    </div>
  );
  return null;
}
