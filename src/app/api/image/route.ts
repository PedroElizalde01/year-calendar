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
  const dotSize = Math.max(9, Math.round(11 * scale));
  const dotRadius = Math.max(2, Math.round(2 * scale));
  const gap = Math.max(5, Math.round(5 * scale));
  const columns = 15;
  const rowWidth = dotSize * columns + gap * (columns - 1);
  const textSize = Math.min(42, Math.max(12, Math.round(12 * scale)));
  const textGap = Math.max(14, Math.round(24 * scale));
  const topOffset = Math.round(height * 0.265);

  const todayISO = now.toISODate();
  const todaySpecial = todayISO ? specialByDate[todayISO] : null;
  const isBirthdayToday = todaySpecial?.isBirthday ?? false;
  const birthdayColor = isBirthdayToday ? todaySpecial?.color : null;

  const dotNodes = dots.map((dot) =>
    h("div", {
      key: dot.dateISO,
      style: {
        width: dotSize,
        height: dotSize,
        borderRadius: dotRadius,
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
        gap: Math.max(8, Math.round(textSize * 0.5)),
        fontSize: textSize,
        letterSpacing: 1,
        fontFamily: "monospace",
      },
    },
    h(
      "span",
      {
        style: {
          color: "#fafafa",
        },
      },
      `${stats.daysLeft}`,
    ),
    h(
      "span",
      {
        style: {
          color: "#52525b",
        },
      },
      "days left",
    ),
    h(
      "span",
      {
        style: {
          color: "#27272a",
        },
      },
      "·",
    ),
    h(
      "span",
      {
        style: {
          color: "#fafafa",
        },
      },
      `${stats.percent}`,
    ),
    h(
      "span",
      {
        style: {
          color: "#52525b",
        },
      },
      "%",
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
              fontFamily: "monospace",
            },
          },
          todaySpecial.label,
        )
      : null;

  const glowLayer = isBirthdayToday && birthdayColor
    ? h("div", {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: `inset 0 0 ${Math.round(height * 0.12)}px ${Math.round(height * 0.04)}px ${birthdayColor}30, inset 0 0 ${Math.round(height * 0.25)}px ${Math.round(height * 0.08)}px ${birthdayColor}18`,
        },
      })
    : null;

  const noiseLayer = h("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      opacity: 0.03,
    },
  });

  const container = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: "#09090b",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "monospace",
        position: "relative",
        overflow: "hidden",
      },
    },
    noiseLayer,
    glowLayer,
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
