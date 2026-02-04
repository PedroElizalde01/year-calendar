import type { ReactNode } from "react";

import type { SpecialDay } from "@/lib/types";
import { formatListDate } from "../format";

export type SpecialDatesCardProps = {
  specialDays: SpecialDay[];
  onOpenAdd: () => void;
  onDelete: (month: number, day: number) => void;
  editor: ReactNode;
};

export const SpecialDatesCard = ({
  specialDays,
  onOpenAdd,
  onDelete,
  editor,
}: SpecialDatesCardProps) => (
  <div className="w-full max-w-3xl border border-[--border] bg-[--surface]/50 p-4 backdrop-blur-sm">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
        Special Dates
      </h2>
      <button
        type="button"
        onClick={onOpenAdd}
        className="flex items-center gap-2 border border-[--border] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[--foreground] transition hover:border-[--accent] hover:text-[--accent]"
      >
        <span className="text-base leading-none">+</span>
        New
      </button>
    </div>

    <div className="mt-4 flex flex-col gap-2">
      {specialDays.length === 0 && (
        <div className="border border-dashed border-[--border] px-4 py-8 text-center font-mono text-[11px] text-[--muted]">
          No special dates yet
        </div>
      )}
      {specialDays.map((item) => (
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
            onClick={() => onDelete(item.month, item.day)}
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

    {editor}
  </div>
);
