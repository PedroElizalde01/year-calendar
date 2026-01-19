import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

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
const ENCODED_PREFIX = "p_";
const BLOB_BASE_URL = process.env.BLOB_BASE_URL ?? "";
const HAS_BLOB_CONFIG = Boolean(process.env.BLOB_READ_WRITE_TOKEN && BLOB_BASE_URL);

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

const generateId = () =>
  randomBytes(6)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const toSanitizedSpecials = (value: SpecialDay[]): SpecialDay[] =>
  value
    .map((item) => ({
      month: Math.trunc(item.month),
      day: Math.trunc(item.day),
      color: typeof item.color === "string" ? item.color : "",
      label: typeof item.label === "string" ? item.label : undefined,
      isBirthday: item.isBirthday ? true : undefined,
    }))
    .filter(
      (item) =>
        item.month >= 1 &&
        item.month <= 12 &&
        item.day >= 1 &&
        item.day <= 31 &&
        typeof item.color === "string" &&
        item.color.length > 0,
    );

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padLength)}`;
  return Buffer.from(padded, "base64").toString("utf8");
};

const encodeProfile = (
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  const payload = {
    timeZone: settings.timeZone,
    specialDays: toSanitizedSpecials(settings.specialDays),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${ENCODED_PREFIX}${encoded}`;
};

const buildRecord = (
  id: string,
  settings: Pick<Settings, "timeZone" | "specialDays">,
): ProfileRecord => ({
  id,
  timeZone: settings.timeZone,
  specialDays: toSanitizedSpecials(settings.specialDays),
  updatedAt: new Date().toISOString(),
});

const blobKeyForId = (id: string) => `profiles/${id}.json`;

const blobUrlForId = (id: string) => {
  if (!BLOB_BASE_URL) {
    return null;
  }
  return `${BLOB_BASE_URL.replace(/\/$/, "")}/${blobKeyForId(id)}`;
};

const fetchBlobProfile = async (id: string): Promise<ProfileRecord | null> => {
  const url = blobUrlForId(id);
  if (!url) {
    return null;
  }
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      return null;
    }
    const parsed = (await response.json()) as ProfileRecord;
    if (!parsed || typeof parsed.timeZone !== "string") {
      return null;
    }
    return {
      id,
      timeZone: parsed.timeZone,
      specialDays: toSanitizedSpecials(parsed.specialDays ?? []),
      updatedAt: typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const blobExists = async (id: string) => {
  const url = blobUrlForId(id);
  if (!url) {
    return false;
  }
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

const writeBlobProfile = async (record: ProfileRecord) => {
  await put(blobKeyForId(record.id), JSON.stringify(record), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  return record;
};

const decodeProfile = (id: string): ProfileRecord | null => {
  if (!id.startsWith(ENCODED_PREFIX)) {
    return null;
  }
  try {
    const raw = base64UrlDecode(id.slice(ENCODED_PREFIX.length));
    const parsed = JSON.parse(raw) as Partial<ProfileRecord> & {
      timeZone?: unknown;
      specialDays?: unknown;
    };
    if (typeof parsed.timeZone !== "string") {
      return null;
    }
    const specials = Array.isArray(parsed.specialDays)
      ? toSanitizedSpecials(parsed.specialDays as SpecialDay[])
      : [];
    return {
      id,
      timeZone: parsed.timeZone,
      specialDays: specials,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const createProfile = async (
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  let id = generateId();
  if (HAS_BLOB_CONFIG) {
    while (await blobExists(id)) {
      id = generateId();
    }
    const record = buildRecord(id, settings);
    try {
      return await writeBlobProfile(record);
    } catch {
      // fall through to local or encoded fallback
    }
  }

  const store = await readStore();
  while (store[id]) {
    id = generateId();
  }
  const record = buildRecord(id, settings);
  try {
    store[id] = record;
    await writeStore(store);
    return record;
  } catch {
    return {
      id: encodeProfile(settings),
      timeZone: record.timeZone,
      specialDays: record.specialDays,
      updatedAt: record.updatedAt,
    };
  }
};

export const updateProfile = async (
  id: string,
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  const decoded = decodeProfile(id);
  if (decoded) {
    return {
      ...decoded,
      id: encodeProfile(settings),
      timeZone: settings.timeZone,
      specialDays: toSanitizedSpecials(settings.specialDays),
      updatedAt: new Date().toISOString(),
    };
  }
  const record = buildRecord(id, settings);
  if (HAS_BLOB_CONFIG) {
    const existing = await fetchBlobProfile(id);
    if (!existing) {
      return null;
    }
    try {
      return await writeBlobProfile(record);
    } catch {
      // fall through to local or encoded fallback
    }
  }

  const store = await readStore();
  if (!store[id]) {
    return null;
  }
  store[id] = record;
  try {
    await writeStore(store);
    return store[id];
  } catch {
    return {
      id: encodeProfile(settings),
      timeZone: record.timeZone,
      specialDays: record.specialDays,
      updatedAt: record.updatedAt,
    };
  }
};

export const getProfile = async (id: string) => {
  if (HAS_BLOB_CONFIG) {
    const blobProfile = await fetchBlobProfile(id);
    if (blobProfile) {
      return blobProfile;
    }
  }
  const store = await readStore();
  return store[id] ?? decodeProfile(id);
};
