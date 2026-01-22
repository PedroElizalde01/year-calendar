"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

import { buildYearDots, getYearStats } from "@/lib/date";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { SpecialDay } from "@/lib/types";

const DEFAULT_SPECIAL_COLOR = "#e879f9";
const COLOR_OPTIONS = [
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDateISO, setEditingDateISO] = useState<string | null>(null);
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

  const todaySpecial = todayKey ? specialByDate[todayKey] : null;
  const isBirthdayToday = todaySpecial?.isBirthday ?? false;
  const birthdayColor = isBirthdayToday ? todaySpecial?.color : null;

  const stats = useMemo(() => getYearStats(now), [now]);
  const dots = useMemo(
    () => buildYearDots(now, specialByDate),
    [now, specialByDate],
  );

  const formatDisplayDate = (dateISO: string) =>
    DateTime.fromISO(dateISO).toFormat("LLL d");

  const formatListDate = (month: number, day: number) =>
    `${day} ${MONTHS_SHORT[month - 1] ?? ""}`.trim();

  const resetDraft = () => {
    setDraftColor(DEFAULT_SPECIAL_COLOR);
    setDraftLabel("");
    setDraftIsBirthday(false);
  };

  const openEditor = (dateISO: string) => {
    const selected = DateTime.fromISO(dateISO).setZone(timeZone);
    if (!selected.isValid) {
      return;
    }
    setEditingDateISO(dateISO);
    setNewMonth(selected.month);
    setNewDay(selected.day);
    const existing = specialByDate[dateISO];
    if (existing) {
      setDraftColor(existing.color);
      setDraftLabel(existing.label ?? "");
      setDraftIsBirthday(Boolean(existing.isBirthday));
    } else {
      resetDraft();
    }
    setIsEditorOpen(true);
  };

  const openAddForm = () => {
    const current = DateTime.now().setZone(timeZone);
    setNewMonth(current.month);
    setNewDay(current.day);
    setEditingDateISO(null);
    resetDraft();
    setIsEditorOpen(true);
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
    const selected = DateTime.fromObject(
      {
        year: now.year,
        month: newMonth,
        day: newDay,
      },
      { zone: timeZone },
    );
    if (!selected.isValid) {
      return;
    }

    const trimmedLabel = draftLabel.trim();
    const special: SpecialDay = {
      month: newMonth,
      day: newDay,
      color: draftColor,
      label: trimmedLabel.length > 0 ? trimmedLabel : undefined,
      isBirthday: draftIsBirthday ? true : undefined,
    };

    setSpecialDays((prev) => {
      const filtered = prev.filter((item) => {
        if (item.month === special.month && item.day === special.day) {
          return false;
        }
        if (editingDateISO) {
          const editing = DateTime.fromISO(editingDateISO).setZone(timeZone);
          if (
            editing.isValid &&
            (editing.month !== special.month || editing.day !== special.day)
          ) {
            return !(item.month === editing.month && item.day === editing.day);
          }
        }
        return true;
      });
      return [...filtered, special].sort((a, b) =>
        a.month === b.month ? a.day - b.day : a.month - b.month,
      );
    });
    setIsEditorOpen(false);
    setEditingDateISO(null);
  };

  const handleDeleteSpecial = (month: number, day: number) => {
    setSpecialDays((prev) =>
      prev.filter((item) => !(item.month === month && item.day === day)),
    );
    if (editingDateISO) {
      const editing = DateTime.fromISO(editingDateISO).setZone(timeZone);
      if (editing.isValid && editing.month === month && editing.day === day) {
        setIsEditorOpen(false);
        setEditingDateISO(null);
        resetDraft();
      }
    }
  };

  const sortedSpecialDays = useMemo(
    () =>
      [...specialDays].sort((a, b) =>
        a.month === b.month ? a.day - b.day : a.month - b.month,
      ),
    [specialDays],
  );

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingDateISO(null);
    resetDraft();
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
        const data = (await response.json()) as { id?: string };
        if (data.id && data.id !== id) {
          id = data.id;
          setProfileId(id);
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
    <div
      className="noise relative min-h-screen w-full bg-[--background] text-[--foreground]"
      style={
        isBirthdayToday && birthdayColor
          ? {
              boxShadow: `inset 0 0 120px 40px ${birthdayColor}30, inset 0 0 250px 80px ${birthdayColor}18`,
            }
          : undefined
      }
    >
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
        <header className="flex w-full flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <label className="group flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">tz</span>
              <select
                className="border-b border-[--border] bg-transparent py-1 font-mono text-xs text-[--foreground] outline-none transition hover:border-[--accent] focus:border-[--accent]"
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
              >
                {(timeZoneOptions.length > 0 ? timeZoneOptions : [timeZone]).map(
                  (zone) => (
                  <option key={zone} value={zone} className="bg-zinc-900 text-white">
                    {zone}
                  </option>
                ),
                )}
              </select>
            </label>
            <label className="group flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">res</span>
              <select
                className="border-b border-[--border] bg-transparent py-1 font-mono text-xs text-[--foreground] outline-none transition hover:border-[--accent] focus:border-[--accent]"
                value={wallpaperPreset}
                onChange={(event) => setWallpaperPreset(event.target.value)}
              >
                <option value="1170x2532" className="bg-zinc-900 text-white">1170×2532</option>
                <option value="1179x2556" className="bg-zinc-900 text-white">1179×2556</option>
                <option value="1206x2622" className="bg-zinc-900 text-white">1206×2622</option>
                <option value="1290x2796" className="bg-zinc-900 text-white">1290×2796</option>
                <option value="1320x2868" className="bg-zinc-900 text-white">1320×2868</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleShareLink}
            className="group relative overflow-hidden border border-[--accent]/40 bg-[--accent]/10 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[--accent] transition-all hover:border-[--accent] hover:bg-[--accent]/20"
          >
            Generate
          </button>
        </header>

        <div className="relative flex flex-col items-center gap-8">
          <div
            className="grid place-content-center gap-[5px]"
            style={{ gridTemplateColumns: "repeat(15, 11px)" }}
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
                  className="h-[9px] w-[9px] rounded-[2px] transition-all duration-150 hover:scale-125 hover:rounded-[3px]"
                  style={{ backgroundColor: dot.displayColor }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-4 font-mono text-xs tracking-wide text-[--muted]">
            <span><span className="text-[--foreground]">{stats.daysLeft}</span> days left</span>
            <span className="text-[--border]">·</span>
            <span><span className="text-[--foreground]">{stats.percent}</span>%</span>
          </div>
        </div>

        <div className="w-full max-w-3xl border border-[--border] bg-[--surface]/50 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
              Automation Link
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-[--muted]">
              {profileId && <span className="text-[--accent]">#{profileId}</span>}
              {hasCopied && <span className="text-emerald-400">✓ copied</span>}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={shareUrl}
              readOnly
              placeholder="Click Generate to get the link"
              className="w-full border-b border-[--border] bg-transparent px-1 py-2 font-mono text-xs text-[--foreground] outline-none placeholder:text-[--muted]/50"
            />
            <button
              type="button"
              onClick={handleShareLink}
              className="shrink-0 border border-[--border] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[--foreground] transition hover:border-[--accent] hover:text-[--accent]"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="w-full max-w-3xl border border-[--border] bg-[--surface]/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
              Special Dates
            </h2>
            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-2 border border-[--border] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[--foreground] transition hover:border-[--accent] hover:text-[--accent]"
            >
              <span className="text-base leading-none">+</span>
              New
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {sortedSpecialDays.length === 0 && (
              <div className="border border-dashed border-[--border] px-4 py-8 text-center font-mono text-[11px] text-[--muted]">
                No special dates yet
              </div>
            )}
            {sortedSpecialDays.map((item) => (
              <div
                key={`${item.month}-${item.day}`}
                className="group flex items-center justify-between border-l-2 bg-[--background]/50 px-4 py-3 transition hover:bg-[--surface]"
                style={{ borderLeftColor: item.color }}
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm text-[--foreground]">
                    {formatListDate(item.month, item.day)}
                  </div>
                  {item.label && (
                    <div className="text-xs text-[--muted]">{item.label}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSpecial(item.month, item.day)}
                  aria-label={`Delete ${formatListDate(item.month, item.day)}`}
                  className="p-2 text-[--muted] opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {isEditorOpen && (
            <div className="mt-4 border border-[--accent]/30 bg-[--background] p-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[--accent]">
                  {editingDateISO ? "Edit Date" : "New Date"}
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  aria-label="Close"
                  className="p-1 text-[--muted] transition hover:text-[--foreground]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={newMonth}
                    onChange={(event) =>
                      setNewMonth(Number(event.target.value))
                    }
                    className="w-full border-b border-[--border] bg-transparent px-1 py-2 text-sm text-[--foreground] outline-none transition focus:border-[--accent]"
                  >
                    {MONTHS_LONG.map((label, idx) => (
                      <option key={label} value={idx + 1} className="bg-zinc-900 text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newDay}
                    onChange={(event) => setNewDay(Number(event.target.value))}
                    className="w-full border-b border-[--border] bg-transparent px-1 py-2 font-mono text-sm text-[--foreground] outline-none transition focus:border-[--accent]"
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
                          className="bg-zinc-900 text-white"
                        >
                          {idx + 1}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">Color</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_OPTIONS.map((color) => {
                      const isSelected = color === draftColor;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDraftColor(color)}
                          className={`p-0.5 transition ${
                            isSelected
                              ? "ring-1 ring-[--foreground] ring-offset-1 ring-offset-[--background]"
                              : ""
                          }`}
                          aria-label={`Color ${color}`}
                        >
                          <span
                            className="block h-5 w-5"
                            style={{ backgroundColor: color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">Label</span>
                  <input
                    type="text"
                    value={draftLabel}
                    onChange={(event) => setDraftLabel(event.target.value)}
                    placeholder="e.g. birthday, anniversary..."
                    maxLength={40}
                    className="w-full border-b border-[--border] bg-transparent px-1 py-2 text-sm text-[--foreground] outline-none transition placeholder:text-[--muted]/50 focus:border-[--accent]"
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-xs text-[--muted]">
                  <input
                    type="checkbox"
                    checked={draftIsBirthday}
                    onChange={(event) => setDraftIsBirthday(event.target.checked)}
                    className="h-4 w-4 accent-[--accent]"
                  />
                  <span>Birthday</span>
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-[--accent] px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-widest text-[--background] transition hover:opacity-90"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="flex-1 border border-[--border] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[--foreground] transition hover:border-[--muted]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {hoverLabel && (
        <div
          className="pointer-events-none fixed z-50 border border-[--border] bg-[--surface] px-2 py-1 font-mono text-[10px] text-[--foreground] shadow-lg"
          style={{ left: hoverPos.x + 12, top: hoverPos.y + 12 }}
        >
          {hoverLabel}
        </div>
      )}
    </div>
  );
}
