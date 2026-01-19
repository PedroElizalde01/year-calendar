import { DateTime } from "luxon";

import type { Settings, SpecialDay } from "@/lib/types";

const STORAGE_KEY = "lifecal_settings_v1";

const isValidDateISO = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidMonthDay = (month: number, day: number) =>
  Number.isInteger(month) &&
  Number.isInteger(day) &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= 31;

const parseSpecialDay = (value: unknown): SpecialDay | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const color = typeof record.color === "string" ? record.color : "";
  const label = typeof record.label === "string" ? record.label : undefined;
  const isBirthday =
    typeof record.isBirthday === "boolean" ? record.isBirthday : undefined;

  if (!color) {
    return null;
  }

  const month =
    typeof record.month === "number" ? Math.trunc(record.month) : null;
  const day = typeof record.day === "number" ? Math.trunc(record.day) : null;

  if (month && day && isValidMonthDay(month, day)) {
    return { month, day, color, label, isBirthday };
  }

  const dateISO = typeof record.dateISO === "string" ? record.dateISO : "";
  if (isValidDateISO(dateISO)) {
    const parsed = DateTime.fromISO(dateISO);
    if (parsed.isValid) {
      return {
        month: parsed.month,
        day: parsed.day,
        color,
        label,
        isBirthday,
      };
    }
  }

  return null;
};

const isSpecialDay = (value: SpecialDay | null): value is SpecialDay =>
  value !== null;

export const loadSettings = (fallbackTimeZone: string): Settings => {
  const base: Settings = {
    timeZone: fallbackTimeZone,
    specialDays: [],
    profileId: undefined,
  };

  if (typeof window === "undefined") {
    return base;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return base;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const timeZone =
      typeof parsed.timeZone === "string"
        ? parsed.timeZone
        : fallbackTimeZone;
    const rawSpecials = Array.isArray(parsed.specialDays)
      ? parsed.specialDays
      : [];
    const specialDays = rawSpecials
      .map(parseSpecialDay)
      .filter(isSpecialDay);
    const profileId =
      typeof parsed.profileId === "string" ? parsed.profileId : undefined;

    return { timeZone, specialDays, profileId };
  } catch {
    return base;
  }
};

export const saveSettings = (settings: Settings): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
