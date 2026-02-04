"use client";

import { useMemo } from "react";

import { buildYearTiles, getYearStats } from "@/lib/date";
import { buildSpecialByDate } from "./utils";
import { useHoverLabel } from "./hooks/useHoverLabel";
import { useSettingsState } from "./hooks/useSettingsState";
import { useShareLink } from "./hooks/useShareLink";
import { useSpecialEditor } from "./hooks/useSpecialEditor";
import { AutomationLinkCard } from "./components/AutomationLinkCard";
import { HeaderControls } from "./components/HeaderControls";
import { HoverLabel } from "./components/HoverLabel";
import { SpecialDateEditor } from "./components/SpecialDateEditor";
import { SpecialDatesCard } from "./components/SpecialDatesCard";
import { TilesGrid } from "./components/TilesGrid";

export const YearTiles = () => {
  const {
    timeZone,
    setTimeZone,
    specialDays,
    setSpecialDays,
    now,
    profileId,
    setProfileId,
    timeZoneOptions,
  } = useSettingsState();

  const specialByDate = useMemo(
    () => buildSpecialByDate(now, timeZone, specialDays),
    [now, timeZone, specialDays],
  );

  const todayKey = now.toISODate();
  const todaySpecial = todayKey ? specialByDate[todayKey] : null;
  const isBirthdayToday = todaySpecial?.isBirthday ?? false;
  const birthdayColor = isBirthdayToday ? todaySpecial?.color : null;

  const stats = useMemo(() => getYearStats(now), [now]);
  const tiles = useMemo(
    () => buildYearTiles(now, specialByDate),
    [now, specialByDate],
  );

  const hover = useHoverLabel();

  const share = useShareLink({
    timeZone,
    specialDays,
    profileId,
    setProfileId,
  });

  const editor = useSpecialEditor({
    now,
    timeZone,
    specialDays,
    setSpecialDays,
    specialByDate,
  });

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
        <HeaderControls
          timeZone={timeZone}
          timeZoneOptions={timeZoneOptions}
          onTimeZoneChange={setTimeZone}
          wallpaperPreset={share.wallpaperPreset}
          onWallpaperPresetChange={share.setWallpaperPreset}
          onGenerate={share.handleShareLink}
        />

        <TilesGrid
          tiles={tiles}
          stats={stats}
          onOpenEditor={editor.openEditor}
          onHover={hover.handleHover}
          onHoverMove={hover.handleHoverMove}
          onHoverLeave={hover.clearHover}
        />

        <AutomationLinkCard
          shareUrl={share.shareUrl}
          hasCopied={share.hasCopied}
          profileId={profileId}
          onGenerate={share.handleShareLink}
        />

        <SpecialDatesCard
          specialDays={editor.sortedSpecialDays}
          onOpenAdd={editor.openAddForm}
          onDelete={editor.handleDeleteSpecial}
          editor={
            <SpecialDateEditor
              isOpen={editor.isEditorOpen}
              isEditing={Boolean(editor.editingDateISO)}
              nowYear={now.year}
              newMonth={editor.newMonth}
              setNewMonth={editor.setNewMonth}
              newDay={editor.newDay}
              setNewDay={editor.setNewDay}
              draftColor={editor.draftColor}
              setDraftColor={editor.setDraftColor}
              draftLabel={editor.draftLabel}
              setDraftLabel={editor.setDraftLabel}
              draftIsBirthday={editor.draftIsBirthday}
              setDraftIsBirthday={editor.setDraftIsBirthday}
              onSave={editor.handleSave}
              onClose={editor.closeEditor}
            />
          }
        />
      </div>
      {hover.hoverLabel && (
        <HoverLabel
          label={hover.hoverLabel}
          x={hover.hoverPos.x}
          y={hover.hoverPos.y}
        />
      )}
    </div>
  );
};
