import type { YearStats, YearTile } from "@/lib/date";
import { formatDisplayDate } from "../format";

export type TilesGridProps = {
  tiles: YearTile[];
  stats: YearStats;
  onOpenEditor: (dateISO: string) => void;
  onHover: (
    label: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onHoverMove: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onHoverLeave: () => void;
};

export const TilesGrid = ({
  tiles,
  stats,
  onOpenEditor,
  onHover,
  onHoverMove,
  onHoverLeave,
}: TilesGridProps) => (
  <div className="relative flex flex-col items-center gap-8">
    <div
      className="grid place-content-center gap-[5px]"
      style={{ gridTemplateColumns: "repeat(15, 11px)" }}
    >
      {tiles.map((tile) => {
        const displayDate = formatDisplayDate(tile.dateISO);
        const label = tile.special?.label
          ? `${displayDate} · ${tile.special.label}`
          : displayDate;

        return (
          <button
            key={tile.dateISO}
            type="button"
            onClick={() => onOpenEditor(tile.dateISO)}
            onMouseEnter={(event) => onHover(label, event)}
            onMouseMove={onHoverMove}
            onMouseLeave={onHoverLeave}
            aria-label={label}
            className="h-[9px] w-[9px] rounded-[2px] transition-all duration-150 hover:scale-125 hover:rounded-[3px]"
            style={{ backgroundColor: tile.displayColor }}
          />
        );
      })}
    </div>

    <div className="flex items-center gap-4 font-mono text-xs tracking-wide text-[--muted]">
      <span>
        <span className="text-[--foreground]">{stats.daysLeft}</span> days
        left
      </span>
      <span className="text-[--border]">·</span>
      <span>
        <span className="text-[--foreground]">{stats.percent}</span>%
      </span>
    </div>
  </div>
);
