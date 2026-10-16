import { nitradoReadFile, nitradoRequest, nitradoWriteFile } from "./nitrado.functions";
import { DEMO_FILES, DEMO_MISSION, DEMO_SERVICE_ID } from "./demo-data";

export type Session = { token: string; serviceId: string; mission: string };

export const isDemo = (s: { token: string }) => s.token === "demo";

const demoFiles = new Map<string, string>();

function demoFile(path: string): string {
  const norm = path.replace(/^\/+/, "");
  if (!demoFiles.has(norm)) {
    const key = Object.keys(DEMO_FILES).find(
      (k) => norm === k || norm.endsWith("/" + k) || k.endsWith("/" + norm),
    );
    if (key !== undefined) demoFiles.set(norm, DEMO_FILES[key]!);
    else throw new Error(`Arquivo não encontrado no modo demonstração: ${path}`);
  }
  return demoFiles.get(norm)!;
}

async function demoApi<T>(method: string, path: string): Promise<T> {
  if (path === "/services") {
    return {
      status: "success",
      data: {
        services: [
          {
            id: DEMO_SERVICE_ID,
            type: "gameserver",
            details: { name: "Servidor Demo · DayZ Xbox", game: "DayZ (Xbox)" },
          },
        ],
      },
    } as T;
  }
  if (path.includes("/gameservers") && method === "GET") {
    return {
      status: "success",
      data: {
        gameserver: {
          status: "active",
          game_specific: { path: "/games/demo/dayzxb" },
          settings: { config: { mission: "dayzOffline.chernarusplus" } },
          query: { player_current: 3, player_max: 32 },
        },
      },
    } as T;
  }
  if (path.includes("/gameservers") && method === "POST") {
    return { status: "success", data: {} } as T;
  }
  return { status: "success", data: {} } as T;
}

export async function api<T = any>(
  s: { token: string },
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, string>,
): Promise<T> {
  if (isDemo(s)) return demoApi<T>(method, path);
  const text = await nitradoRequest({ data: { token: s.token, method, path, body } });
  return JSON.parse(text);
}

export const readFile = (s: Session, file: string) => {
  if (isDemo(s)) return Promise.resolve(demoFile(file));
  return nitradoReadFile({ data: { token: s.token, serviceId: s.serviceId, file } });
};

export function writeFile(s: Session, file: string, content: string) {
  if (isDemo(s)) {
    demoFiles.set(file.replace(/^\/+/, ""), content);
    return Promise.resolve({ status: "success" });
  }
  const i = file.lastIndexOf("/");
  return nitradoWriteFile({
    data: {
      token: s.token,
      serviceId: s.serviceId,
      dir: file.slice(0, i),
      name: file.slice(i + 1),
      content,
    },
  });
}

export const demoSession = (): Session => ({
  token: "demo",
  serviceId: String(DEMO_SERVICE_ID),
  mission: DEMO_MISSION,
});

export const missionFile = (s: Session, rel: string) => `${s.mission.replace(/\/$/, "")}/${rel}`;
