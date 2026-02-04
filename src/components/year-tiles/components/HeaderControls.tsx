import type { ChangeEvent } from "react";

export type HeaderControlsProps = {
  timeZone: string;
  timeZoneOptions: string[];
  onTimeZoneChange: (value: string) => void;
  wallpaperPreset: string;
  onWallpaperPresetChange: (value: string) => void;
  onGenerate: () => void;
};

const WALLPAPER_OPTIONS = [
  "1170x2532",
  "1179x2556",
  "1206x2622",
  "1290x2796",
  "1320x2868",
];

export const HeaderControls = ({
  timeZone,
  timeZoneOptions,
  onTimeZoneChange,
  wallpaperPreset,
  onWallpaperPresetChange,
  onGenerate,
}: HeaderControlsProps) => {
  const handleTimeZoneChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onTimeZoneChange(event.target.value);

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onWallpaperPresetChange(event.target.value);

  return (
    <header className="flex w-full flex-col items-center justify-between gap-5 sm:flex-row">
      <div className="flex flex-wrap items-center gap-4">
        <label className="group flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
            tz
          </span>
          <select
            className="border-b border-[--border] bg-transparent py-1 font-mono text-xs text-[--foreground] outline-none transition hover:border-[--accent] focus:border-[--accent]"
            value={timeZone}
            onChange={handleTimeZoneChange}
          >
            {(timeZoneOptions.length > 0 ? timeZoneOptions : [timeZone]).map(
              (zone) => (
                <option
                  key={zone}
                  value={zone}
                  className="bg-zinc-900 font-mono text-white"
                >
                  {zone}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="group flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
            res
          </span>
          <select
            className="border-b border-[--border] bg-transparent py-1 font-mono text-xs text-[--foreground] outline-none transition hover:border-[--accent] focus:border-[--accent]"
            value={wallpaperPreset}
            onChange={handlePresetChange}
          >
            {WALLPAPER_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-zinc-900 font-mono text-white"
              >
                {option.replace("x", "×")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        className="group relative overflow-hidden border border-[--accent]/40 bg-[--accent]/10 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[--accent] transition-all hover:border-[--accent] hover:bg-[--accent]/20"
      >
        Generate
      </button>
    </header>
  );
};
