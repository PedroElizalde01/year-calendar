import { DateTime } from "luxon";
import { MONTHS_SHORT } from "./constants";

export const formatDisplayDate = (dateISO: string) =>
  DateTime.fromISO(dateISO).toFormat("LLL d");

export const formatListDate = (month: number, day: number) =>
  `${day} ${MONTHS_SHORT[month - 1] ?? ""}`.trim();
