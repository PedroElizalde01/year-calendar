import { DateTime } from "luxon";

import type { SpecialDay } from "@/lib/types";

export const buildSpecialByDate = (
  now: DateTime,
  timeZone: string,
  specialDays: SpecialDay[],
): Record<string, SpecialDay> => {
  const map: Record<string, SpecialDay> = {};
  const year = now.year;
  for (const item of specialDays) {
    const dateISO = DateTime.fromObject(
      {
        year,
        month: item.month,
        day: item.day,
      },
      { zone: timeZone },
    ).toISODate();
    if (dateISO) {
      map[dateISO] = item;
    }
  }
  return map;
};
