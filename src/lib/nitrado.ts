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

export type GameServerData = {
  status: string;
  slots: number;
  game_specific: { path: string };
  settings: Record<string, Record<string, string>>;
  query: {
    player_current: number;
    player_max: number;
    server_name: string;
  };
};

const demoGs: GameServerData = {
  status: "started",
  slots: 32,
  game_specific: { path: "/games/demo/dayzxb" },
  settings: {
    config: {
      hostname: "DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]",
      mission: "dayzOffline.chernarusplus",
      maxPlayers: "32",
      serverTime: "SystemTime",
      serverTimeAcceleration: "6",
      serverNightTimeAcceleration: "4",
      disableCrossplay: "0",
      steamQueryPort: "27016",
    },
    general: {
      autoRestart: "4",
    },
  },
  query: {
    player_current: 12,
    player_max: 32,
    server_name: "DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]",
  },
};

async function demoApi<T>(method: string, path: string, body?: Record<string, string>): Promise<T> {
  if (path === "/services") {
    return {
      status: "success",
      data: {
        services: [
          {
            id: DEMO_SERVICE_ID,
            type: "gameserver",
            details: { name: "DayZ Brasil · Nitrado Xbox [Loot x2 | PvP]", game: "DayZ (Xbox)" },
          },
        ],
      },
    } as T;
  }
  if (path.includes("/gameservers") && method === "GET") {
    return {
      status: "success",
      data: {
        gameserver: { ...demoGs },
      },
    } as T;
  }
  if (path.includes("/gameservers") && method === "POST") {
    if (path.endsWith("/restart")) {
      demoGs.status = "started";
    } else if (path.endsWith("/stop")) {
      demoGs.status = "stopped";
    } else if (body && body.category && body.key) {
      if (!demoGs.settings[body.category]) demoGs.settings[body.category] = {};
      demoGs.settings[body.category][body.key] = body.value;
      if (body.key === "maxPlayers") {
        const val = Number(body.value) || 32;
        demoGs.slots = val;
        demoGs.query.player_max = val;
      }
      if (body.key === "hostname") {
        demoGs.query.server_name = body.value;
      }
    }
    return { status: "success", data: {} } as T;
  }
  return { status: "success", data: {} } as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(
  s: { token: string },
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, string>,
): Promise<T> {
  if (isDemo(s)) return demoApi<T>(method, path, body);
  const text = await nitradoRequest({ data: { token: s.token, method, path, body } });
  return JSON.parse(text);
}

export const readFile = (s: Session, file: string) => {
  if (isDemo(s)) return Promise.resolve(demoFile(file));
  return nitradoReadFile({ data: { token: s.token, serviceId: s.serviceId, file } });
};

export function writeFile(s: Session, file: string, content: string) {
  if (isDemo(s)) {
    const norm = file.replace(/^\/+/, "");
    demoFiles.set(norm, content);
    if (norm.endsWith("serverDZ.cfg")) {
      const matchMax = content.match(/maxPlayers\s*=\s*(\d+);/);
      if (matchMax) {
        const val = Number(matchMax[1]);
        demoGs.slots = val;
        demoGs.query.player_max = val;
        if (demoGs.settings.config) demoGs.settings.config.maxPlayers = String(val);
      }
      const matchHost = content.match(/hostname\s*=\s*"([^"]+)";/);
      if (matchHost) {
        demoGs.query.server_name = matchHost[1];
        if (demoGs.settings.config) demoGs.settings.config.hostname = matchHost[1];
      }
    }
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
