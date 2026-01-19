import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

import type { Settings, SpecialDay } from "@/lib/types";

type ProfileRecord = {
  id: string;
  timeZone: string;
  specialDays: SpecialDay[];
  updatedAt: string;
};

const BLOB_BASE_URL = process.env.BLOB_BASE_URL ?? "";
const HAS_BLOB_CONFIG = Boolean(process.env.BLOB_READ_WRITE_TOKEN && BLOB_BASE_URL);

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

export const createProfile = async (
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  if (!HAS_BLOB_CONFIG) {
    throw new Error("blob-not-configured");
  }
  let id = generateId();
  while (await blobExists(id)) {
    id = generateId();
  }
  const record = buildRecord(id, settings);
  return writeBlobProfile(record);
};

export const updateProfile = async (
  id: string,
  settings: Pick<Settings, "timeZone" | "specialDays">,
) => {
  if (!HAS_BLOB_CONFIG) {
    throw new Error("blob-not-configured");
  }
  const record = buildRecord(id, settings);
  const existing = await fetchBlobProfile(id);
  if (!existing) {
    return null;
  }
  return writeBlobProfile(record);
};

export const getProfile = async (id: string) => {
  if (!HAS_BLOB_CONFIG) {
    return null;
  }
  return fetchBlobProfile(id);
};
