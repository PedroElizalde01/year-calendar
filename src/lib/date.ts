import { DateTime } from "luxon";

import type { SpecialDay } from "@/lib/types";

export type YearStats = {
  daysInYear: number;
  dayOfYear: number;
  daysLeft: number;
  percent: number;
};

export type YearTile = {
  dateISO: string;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  baseColor: string;
  displayColor: string;
  special?: SpecialDay;
};

export const getYearStats = (now: DateTime): YearStats => {
  const day = now.startOf("day");
  const daysInYear = day.daysInYear;
  const dayOfYear = day.ordinal;
  const daysLeft = daysInYear - dayOfYear;
  const percent = Math.round((dayOfYear / daysInYear) * 100);

  return { daysInYear, dayOfYear, daysLeft, percent };
};

export const buildYearTiles = (
  now: DateTime,
  specialByDate: Record<string, SpecialDay>,
): YearTile[] => {
  const start = now.startOf("year");
  const today = now.startOf("day");
  const daysInYear = start.daysInYear;
  const tiles: YearTile[] = [];

  for (let i = 0; i < daysInYear; i += 1) {
    const date = start.plus({ days: i });
    const dateISO = date.toISODate();
    if (!dateISO) {
      continue;
    }

    const isToday = date.hasSame(today, "day");
    const isPast = date < today;
    const isFuture = date > today;
    const baseColor = isToday ? "#ff6a3d" : isPast ? "#ffffff" : "#2c2c2c";
    const special = specialByDate[dateISO];
    const displayColor = special?.color ?? baseColor;

    tiles.push({
      dateISO,
      isPast,
      isToday,
      isFuture,
      baseColor,
      displayColor,
      special,
    });
  }

  return tiles;
};
