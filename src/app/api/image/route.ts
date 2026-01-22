import { ImageResponse } from "next/og";
import { DateTime } from "luxon";
import type { NextRequest } from "next/server";
import { createElement as h } from "react";

import { buildYearDots, getYearStats } from "@/lib/date";
import type { SpecialDay } from "@/lib/types";
import { getProfile } from "@/lib/profileStore";

export const runtime = "nodejs";

const DEFAULT_WIDTH = 1170;
const DEFAULT_HEIGHT = 2532;

const isSpecialDay = (value: SpecialDay | null): value is SpecialDay =>
  value !== null;

const parseSpecialDays = (
  raw: string | null,
  compact: string | null,
): SpecialDay[] => {
  if (!raw) {
    if (!compact) {
      return [];
    }
  }

  try {
    if (compact) {
      const entries = compact.split("~").filter(Boolean);
      const specials: Array<SpecialDay | null> = entries.map((entry) => {
        const [monthRaw, dayRaw, colorRaw, labelRaw, birthdayRaw] =
          entry.split("-");
        const month = Number.parseInt(monthRaw ?? "", 10);
        const day = Number.parseInt(dayRaw ?? "", 10);
        const color = colorRaw ? `#${colorRaw}` : "";
        const label = labelRaw ? decodeURIComponent(labelRaw) : undefined;
        const isBirthday = birthdayRaw === "b" ? true : undefined;

        if (!color || month < 1 || month > 12 || day < 1 || day > 31) {
          return null;
        }

        return { month, day, color, label, isBirthday };
      });

      return specials.filter(isSpecialDay);
    }

    if (raw) {
      const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
      if (!Array.isArray(parsed)) {
        return [];
      }

      const specials: Array<SpecialDay | null> = parsed.map((item) => {
        const month =
          typeof item.month === "number" ? Math.trunc(item.month) : 0;
        const day = typeof item.day === "number" ? Math.trunc(item.day) : 0;
        const color = typeof item.color === "string" ? item.color : "";
        const label = typeof item.label === "string" ? item.label : undefined;
        const isBirthday =
          typeof item.isBirthday === "boolean" ? item.isBirthday : undefined;

        if (!color || month < 1 || month > 12 || day < 1 || day > 31) {
          return null;
        }

        return { month, day, color, label, isBirthday };
      });

      return specials.filter(isSpecialDay);
    }

    return [];
  } catch {
    return [];
  }
};

const toClampedInt = (
  value: string | null,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

export const GET = (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("id");
  const timeZoneParam = searchParams.get("tz") ?? "UTC";
  const width = toClampedInt(searchParams.get("w"), DEFAULT_WIDTH, 800, 3000);
  const height = toClampedInt(searchParams.get("h"), DEFAULT_HEIGHT, 1200, 4000);
  const specialDays = parseSpecialDays(
    searchParams.get("special"),
    searchParams.get("s"),
  );

  if (profileId) {
    return getProfile(profileId).then((profile) => {
      if (!profile) {
        console.error(`[api/image] Profile not found: ${profileId}`);
        return Response.json(
          { error: "not-found", profileId },
          { status: 404 },
        );
      }

      return renderImage({
        timeZone: profile.timeZone,
        specialDays: profile.specialDays,
        width,
        height,
      });
    });
  }

  return renderImage({
    timeZone: timeZoneParam,
    specialDays,
    width,
    height,
  });
};

const renderImage = ({
  timeZone,
  specialDays,
  width,
  height,
}: {
  timeZone: string;
  specialDays: SpecialDay[];
  width: number;
  height: number;
}) => {
  const zoned = DateTime.now().setZone(timeZone);
  const now = zoned.isValid ? zoned : DateTime.now().setZone("UTC");

  const specialByDate: Record<string, SpecialDay> = {};
  for (const item of specialDays) {
    const dateISO = DateTime.fromObject(
      {
        year: now.year,
        month: item.month,
        day: item.day,
      },
      { zone: timeZone },
    ).toISODate();
    if (dateISO) {
      specialByDate[dateISO] = item;
    }
  }

  const stats = getYearStats(now);
  const dots = buildYearDots(now, specialByDate);

  const scale = Math.min(width / 400, 3.0);
  const dotSize = Math.max(9, Math.round(13 * scale));
  const gap = Math.max(6, Math.round(8 * scale));
  const columns = 15;
  const rowWidth = dotSize * columns + gap * (columns - 1);
  const textSize = Math.min(42, Math.max(12, Math.round(12 * scale)));
  const textGap = Math.max(14, Math.round(20 * scale));
  const topOffset = Math.round(height * 0.265);

  const todayISO = now.toISODate();
  const todaySpecial = todayISO ? specialByDate[todayISO] : null;

  const dotNodes = dots.map((dot) =>
    h("div", {
      key: dot.dateISO,
      style: {
        width: dotSize,
        height: dotSize,
        borderRadius: 999,
        backgroundColor: dot.displayColor,
      },
    }),
  );

  const rowNodes: ReturnType<typeof h>[] = [];
  for (let i = 0; i < dotNodes.length; i += columns) {
    rowNodes.push(
      h(
        "div",
        {
          key: `row-${i}`,
          style: {
            display: "flex",
            gap,
            width: rowWidth,
            justifyContent: "center",
          },
        },
        dotNodes.slice(i, i + columns),
      ),
    );
  }

  const grid = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap,
        justifyContent: "center",
      },
    },
    rowNodes,
  );

  const text = h(
    "div",
    {
      style: {
        display: "flex",
        gap: Math.max(6, Math.round(textSize * 0.35)),
        fontSize: textSize,
        letterSpacing: 0.5,
      },
    },
    h(
      "span",
      {
        style: {
          color: "#ff6a3d",
        },
      },
      `${stats.daysLeft}d left`,
    ),
    h(
      "span",
      {
        style: {
          color: "#bdbdbd",
        },
      },
      `· ${stats.percent}%`,
    ),
  );

  const specialLabelText =
    todaySpecial && todaySpecial.label
      ? h(
          "div",
          {
            style: {
              fontSize: Math.round(textSize * 1.2),
              color: todaySpecial.color,
              letterSpacing: 1,
            },
          },
          todaySpecial.label,
        )
      : null;

  const container = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: "#0b0b0b",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "Arial, Helvetica, sans-serif",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: textGap,
          marginTop: topOffset,
        },
      },
      grid,
      specialLabelText,
      text,
    ),
  );

  return new ImageResponse(container, { width, height });
};
