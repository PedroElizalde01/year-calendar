import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

import type { Settings, SpecialDay } from "@/lib/types";

type ProfileRecord = {
  id: string;
  timeZone: string;
  specialDays: SpecialDay[];
  updatedAt: string;
};

type ProfileMap = Record<string, ProfileRecord>;

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "profiles.json");

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

const readStore = async (): Promise<ProfileMap> => {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as ProfileMap;
  } catch {
    return {};
  }
};

const writeStore = async (store: ProfileMap) => {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
};

const generateId = () => randomBytes(6).toString("hex");

export const createProfile = async (
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  const store = await readStore();
  let id = generateId();
  while (store[id]) {
    id = generateId();
  }

  const record: ProfileRecord = {
    id,
    timeZone: settings.timeZone,
    specialDays: settings.specialDays,
    updatedAt: new Date().toISOString(),
  };

  store[id] = record;
  await writeStore(store);
  return record;
};

export const updateProfile = async (
  id: string,
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  const store = await readStore();
  if (!store[id]) {
    return null;
  }

  store[id] = {
    id,
    timeZone: settings.timeZone,
    specialDays: settings.specialDays,
    updatedAt: new Date().toISOString(),
  };

  await writeStore(store);
  return store[id];
};

export const getProfile = async (id: string) => {
  const store = await readStore();
  return store[id] ?? null;
};
