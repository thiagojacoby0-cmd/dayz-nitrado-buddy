import { createServerFn } from "@tanstack/react-start";

const BASE = "https://api.nitrado.net";

function checkPath(p: string) {
  if (!/^\/(services|user)[\w/\-.?=&%]*$/.test(p)) throw new Error("Caminho inválido");
}

async function call(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Nitrado [${res.status}]: ${text.slice(0, 300)}`);
  return text;
}

export const nitradoRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; method: "GET" | "POST" | "PUT" | "DELETE"; path: string; body?: Record<string, string> }) => {
    if (!d.token) throw new Error("Token ausente");
    checkPath(d.path);
    return d;
  })
  .handler(async ({ data }) => call(data.token, data.method, data.path, data.body));

export const nitradoReadFile = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; serviceId: string; file: string }) => d)
  .handler(async ({ data }) => {
    const path = `/services/${encodeURIComponent(data.serviceId)}/gameservers/file_server/download?file=${encodeURIComponent(data.file)}`;
    const json = JSON.parse(await call(data.token, "GET", path));
    const url = json?.data?.token?.url;
    if (!url) throw new Error("Não foi possível baixar o arquivo");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download falhou [${res.status}]`);
    return await res.text();
  });

export const nitradoWriteFile = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; serviceId: string; dir: string; name: string; content: string }) => d)
  .handler(async ({ data }) => {
    const path = `/services/${encodeURIComponent(data.serviceId)}/gameservers/file_server/upload?path=${encodeURIComponent(data.dir)}&file=${encodeURIComponent(data.name)}`;
    const json = JSON.parse(await call(data.token, "POST", path));
    const t = json?.data?.token;
    if (!t?.url) throw new Error("Upload não autorizado");
    const res = await fetch(t.url, {
      method: "POST",
      headers: { token: t.token, "Content-Type": "application/binary" },
      body: data.content,
    });
    if (!res.ok) throw new Error(`Upload falhou [${res.status}]: ${(await res.text()).slice(0, 200)}`);
    return "ok";
  });
