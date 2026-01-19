"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

import { buildYearDots, getYearStats } from "@/lib/date";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { SpecialDay } from "@/lib/types";

const DEFAULT_SPECIAL_COLOR = "#7c5cff";

const getResolvedTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const getSupportedTimeZones = (fallback: string) => {
  if (typeof Intl.supportedValuesOf === "function") {
    const zones = Intl.supportedValuesOf("timeZone");
    if (zones.length > 0) {
      return zones;
    }
  }

  return [fallback];
};

export default function YearDots() {
  const defaultTimeZone = "UTC";
  const [timeZone, setTimeZone] = useState(defaultTimeZone);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [now, setNow] = useState(() =>
    DateTime.now().setZone(defaultTimeZone),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(DEFAULT_SPECIAL_COLOR);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftIsBirthday, setDraftIsBirthday] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [wallpaperPreset, setWallpaperPreset] = useState("1170x2532");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [timeZoneOptions, setTimeZoneOptions] = useState<string[]>([]);
  const [newMonth, setNewMonth] = useState<number>(() =>
    DateTime.now().setZone(defaultTimeZone).month,
  );
  const [newDay, setNewDay] = useState<number>(() =>
    DateTime.now().setZone(defaultTimeZone).day,
  );
  const [hoverLabel, setHoverLabel] = useState("");
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const hasHydrated = useRef(false);

  useEffect(() => {
    const resolved = getResolvedTimeZone();
    const settings = loadSettings(resolved);
    setTimeZone(settings.timeZone);
    setSpecialDays(settings.specialDays);
    setNow(DateTime.now().setZone(settings.timeZone));
    setNewMonth(DateTime.now().setZone(settings.timeZone).month);
    setNewDay(DateTime.now().setZone(settings.timeZone).day);
    setProfileId(settings.profileId ?? null);

    const zones = getSupportedTimeZones(resolved);
    setTimeZoneOptions(
      zones.includes(settings.timeZone)
        ? zones
        : [settings.timeZone, ...zones],
    );
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    saveSettings({ timeZone, specialDays, profileId: profileId ?? undefined });
  }, [timeZone, specialDays, profileId]);

  useEffect(() => {
    setNow(DateTime.now().setZone(timeZone));
  }, [timeZone]);

  const todayKey = now.toISODate();

  useEffect(() => {
    const current = DateTime.now().setZone(timeZone);
    const nextMidnight = current.plus({ days: 1 }).startOf("day");
    const msUntilNext = Math.max(nextMidnight.diff(current).toMillis(), 0);
    const timeoutId = window.setTimeout(() => {
      setNow(DateTime.now().setZone(timeZone));
    }, msUntilNext + 25);

    return () => window.clearTimeout(timeoutId);
  }, [timeZone, todayKey]);

  useEffect(() => {
    setTimeZoneOptions((prev) =>
      prev.includes(timeZone) ? prev : [timeZone, ...prev],
    );
  }, [timeZone]);

  const specialByDate = useMemo(() => {
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
  }, [specialDays, now.year, timeZone]);

  const stats = useMemo(() => getYearStats(now), [now]);
  const dots = useMemo(
    () => buildYearDots(now, specialByDate),
    [now, specialByDate],
  );

  const formatDisplayDate = (dateISO: string) =>
    DateTime.fromISO(dateISO).toFormat("LLL d");

  const openEditor = (dateISO: string) => {
    setSelectedDate(dateISO);
    const existing = specialByDate[dateISO];
    if (existing) {
      setDraftColor(existing.color);
      setDraftLabel(existing.label ?? "");
      setDraftIsBirthday(Boolean(existing.isBirthday));
      return;
    }

    setDraftColor(DEFAULT_SPECIAL_COLOR);
    setDraftLabel("");
    setDraftIsBirthday(false);
  };

  const handleAddByDate = () => {
    const date = DateTime.fromObject(
      {
        year: now.year,
        month: newMonth,
        day: newDay,
      },
      { zone: timeZone },
    );
    const dateISO = date.toISODate();
    if (dateISO) {
      openEditor(dateISO);
    }
  };

  const handleHover = (
    label: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setHoverLabel(label);
    setHoverPos({ x: event.clientX, y: event.clientY });
  };

  const handleHoverMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHoverPos({ x: event.clientX, y: event.clientY });
  };

  const clearHover = () => setHoverLabel("");

  const handleSave = () => {
    if (!selectedDate) {
      return;
    }

    const selected = DateTime.fromISO(selectedDate).setZone(timeZone);
    if (!selected.isValid) {
      return;
    }

    const trimmedLabel = draftLabel.trim();
    const fallbackLabel = draftIsBirthday ? "Happy Birthday" : undefined;
    const special: SpecialDay = {
      month: selected.month,
      day: selected.day,
      color: draftColor,
      label: trimmedLabel.length > 0 ? trimmedLabel : fallbackLabel,
      isBirthday: draftIsBirthday ? true : undefined,
    };

    setSpecialDays((prev) => {
      const filtered = prev.filter(
        (item) => !(item.month === special.month && item.day === special.day),
      );
      return [...filtered, special].sort((a, b) =>
        a.month === b.month ? a.day - b.day : a.month - b.month,
      );
    });
  };

  const handleDelete = () => {
    if (!selectedDate) {
      return;
    }

    setSpecialDays((prev) =>
      prev.filter((item) => {
        if (!selectedDate) {
          return true;
        }
        const selected = DateTime.fromISO(selectedDate).setZone(timeZone);
        return !(
          selected.isValid &&
          item.month === selected.month &&
          item.day === selected.day
        );
      }),
    );
    setSelectedDate(null);
    setDraftColor(DEFAULT_SPECIAL_COLOR);
    setDraftLabel("");
    setDraftIsBirthday(false);
  };

  const handleShareLink = async () => {
    const [width, height] = wallpaperPreset
      .split("x")
      .map((value) => Number(value));
    const payload = { timeZone, specialDays };
    let id = profileId;

    try {
      if (id) {
        const response = await fetch(`/api/profile/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("profile-update-failed");
        }
      } else {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("profile-create-failed");
        }
        const data = (await response.json()) as { id: string };
        id = data.id;
        setProfileId(id);
      }
    } catch {
      // Fallback to compact query if profile creation fails.
    }

    const url = new URL("/api/image", window.location.origin);
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    if (id) {
      url.searchParams.set("id", id);
    } else if (specialDays.length > 0) {
      url.searchParams.set("tz", timeZone);
      const compact = specialDays
        .map((item) => {
          const label = item.label
            ? encodeURIComponent(item.label)
                .replace(/-/g, "%2D")
                .replace(/~/g, "%7E")
            : "";
          const birthday = item.isBirthday ? "b" : "";
          return `${item.month}-${item.day}-${item.color.replace("#", "")}-${label}-${birthday}`;
        })
        .join("~");
      url.searchParams.set("s", compact);
    }

    const link = url.toString();
    setShareUrl(link);

    try {
      await navigator.clipboard.writeText(link);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setHasCopied(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="flex w-full flex-col items-center justify-between gap-4 text-xs text-zinc-400 sm:flex-row">
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Timezone
            <select
              className="rounded border border-zinc-800 bg-transparent px-2 py-1 text-xs text-zinc-200 outline-none transition focus:border-zinc-600"
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
            >
              {(timeZoneOptions.length > 0 ? timeZoneOptions : [timeZone]).map(
                (zone) => (
                <option key={zone} value={zone} className="text-black">
                  {zone}
                </option>
              ),
              )}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Tamaño
            <select
              className="rounded border border-zinc-800 bg-transparent px-2 py-1 text-xs text-zinc-200 outline-none transition focus:border-zinc-600"
              value={wallpaperPreset}
              onChange={(event) => setWallpaperPreset(event.target.value)}
            >
              <option value="1170x2532" className="text-black">
                iPhone 14 / 15 (1170x2532)
              </option>
              <option value="1179x2556" className="text-black">
                iPhone 15 Pro (1179x2556)
              </option>
              <option value="1206x2622" className="text-black">
                iPhone 16 Pro (1206x2622)
              </option>
              <option value="1290x2796" className="text-black">
                iPhone 14/15 Pro Max (1290x2796)
              </option>
              <option value="1320x2868" className="text-black">
                iPhone 16 Pro Max (1320x2868)
              </option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleShareLink}
            className="rounded-full border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aceptar
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div
            className="grid place-content-center gap-[6px]"
            style={{ gridTemplateColumns: "repeat(15, 12px)" }}
          >
            {dots.map((dot) => {
              const displayDate = formatDisplayDate(dot.dateISO);
              const label = dot.special?.label
                ? `${displayDate} · ${dot.special.label}`
                : displayDate;

              return (
                <button
                  key={dot.dateISO}
                  type="button"
                  onClick={() => openEditor(dot.dateISO)}
                  onMouseEnter={(event) => handleHover(label, event)}
                  onMouseMove={handleHoverMove}
                  onMouseLeave={clearHover}
                  aria-label={label}
                  className="h-[10px] w-[10px] rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: dot.displayColor }}
                />
              );
            })}
          </div>

          <div className="text-sm text-zinc-300">
            {stats.daysLeft}d left · {stats.percent}%
          </div>
        </div>

        <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-[#0f0f0f] px-4 py-3 text-sm text-zinc-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-zinc-500">
              Link para automation (perfil persistente)
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
              {profileId && <span>Perfil: {profileId}</span>}
              {hasCopied && <span>Copiado</span>}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={shareUrl}
              readOnly
              placeholder="Presioná Aceptar para generar el link"
              className="w-full rounded border border-zinc-700 bg-transparent px-2 py-2 text-xs text-zinc-200 outline-none"
            />
            <button
              type="button"
              onClick={handleShareLink}
              className="rounded-full border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-500"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-[#0f0f0f] px-4 py-3 text-sm text-zinc-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2 text-xs text-zinc-400">
              Agregar fecha manual
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={newMonth}
                  onChange={(event) =>
                    setNewMonth(Number(event.target.value))
                  }
                  className="w-full rounded border border-zinc-700 bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  {Array.from({ length: 12 }, (_, idx) => (
                    <option
                      key={idx + 1}
                      value={idx + 1}
                      className="text-black"
                    >
                      {DateTime.fromObject({ month: idx + 1 }).toFormat(
                        "LLLL",
                      )}
                    </option>
                  ))}
                </select>
                <select
                  value={newDay}
                  onChange={(event) => setNewDay(Number(event.target.value))}
                  className="w-full rounded border border-zinc-700 bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                >
                  {Array.from(
                    {
                      length:
                        DateTime.fromObject({
                          year: now.year,
                          month: newMonth,
                        }).daysInMonth ?? 31,
                    },
                    (_, idx) => (
                      <option
                        key={idx + 1}
                        value={idx + 1}
                        className="text-black"
                      >
                        {idx + 1}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </label>
            <button
              type="button"
              onClick={handleAddByDate}
              className="rounded-full border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-500"
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="w-full max-w-xl rounded-lg border border-zinc-800 bg-[#0f0f0f] px-4 py-3 text-sm text-zinc-200">
          {!selectedDate && (
            <div className="text-center text-xs text-zinc-500">
              Click en un día para marcarlo como especial.
            </div>
          )}

          {selectedDate && (
            <div className="flex flex-col gap-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                Día especial
              </div>
              <div className="text-sm text-zinc-200">
                {formatDisplayDate(selectedDate)}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  Color
                  <input
                    type="color"
                    value={draftColor}
                    onChange={(event) => setDraftColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-transparent"
                  />
                </label>
                <label className="flex flex-1 items-center gap-2 text-xs text-zinc-400">
                  Label
                  <input
                    type="text"
                    value={draftLabel}
                    onChange={(event) => setDraftLabel(event.target.value)}
                    placeholder="Opcional"
                    maxLength={40}
                    className="w-full rounded border border-zinc-700 bg-transparent px-2 py-1 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  Cumpleaños
                  <input
                    type="checkbox"
                    checked={draftIsBirthday}
                    onChange={(event) => setDraftIsBirthday(event.target.checked)}
                    className="h-4 w-4 accent-[#f5a623]"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition hover:border-zinc-500"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition hover:border-zinc-500"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {hoverLabel && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-black/90 px-2 py-1 text-[11px] text-zinc-100"
          style={{ left: hoverPos.x + 12, top: hoverPos.y + 12 }}
        >
          {hoverLabel}
        </div>
      )}
    </div>
  );
}
