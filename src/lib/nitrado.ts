import { nitradoReadFile, nitradoRequest, nitradoWriteFile } from "./nitrado.functions";

export type Session = { token: string; serviceId: string; mission: string };

export async function api<T = any>(s: { token: string }, method: "GET" | "POST" | "DELETE", path: string, body?: Record<string, string>): Promise<T> {
  const text = await nitradoRequest({ data: { token: s.token, method, path, body } });
  return JSON.parse(text);
}

export const readFile = (s: Session, file: string) =>
  nitradoReadFile({ data: { token: s.token, serviceId: s.serviceId, file } });

export function writeFile(s: Session, file: string, content: string) {
  const i = file.lastIndexOf("/");
  return nitradoWriteFile({ data: { token: s.token, serviceId: s.serviceId, dir: file.slice(0, i), name: file.slice(i + 1), content } });
}

export const missionFile = (s: Session, rel: string) => `${s.mission.replace(/\/$/, "")}/${rel}`;
