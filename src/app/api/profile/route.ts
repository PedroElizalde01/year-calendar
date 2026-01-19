import type { NextRequest } from "next/server";

import type { SpecialDay } from "@/lib/types";
import { createProfile } from "@/lib/profileStore";

export const runtime = "nodejs";

const parseSpecialDays = (value: unknown): SpecialDay[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const specials: SpecialDay[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const month = typeof record.month === "number" ? Math.trunc(record.month) : 0;
    const day = typeof record.day === "number" ? Math.trunc(record.day) : 0;
    const color = typeof record.color === "string" ? record.color : "";
    const label = typeof record.label === "string" ? record.label : undefined;
    const isBirthday =
      typeof record.isBirthday === "boolean" ? record.isBirthday : undefined;

    if (!color || month < 1 || month > 12 || day < 1 || day > 31) {
      continue;
    }

    specials.push({ month, day, color, label, isBirthday });
  }

  return specials;
};

export const POST = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const timeZone = typeof body.timeZone === "string" ? body.timeZone : "";
    const specialDays = parseSpecialDays(body.specialDays);

    if (!timeZone) {
      return Response.json({ error: "invalid-timezone" }, { status: 400 });
    }

    const profile = await createProfile({ timeZone, specialDays });
    return Response.json({ id: profile.id });
  } catch {
    return Response.json({ error: "storage-error" }, { status: 500 });
  }
};
