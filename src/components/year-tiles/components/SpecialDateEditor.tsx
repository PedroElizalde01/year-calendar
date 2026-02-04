import { DateTime } from "luxon";

import { COLOR_OPTIONS, MONTHS_LONG } from "../constants";

export type SpecialDateEditorProps = {
  isOpen: boolean;
  isEditing: boolean;
  nowYear: number;
  newMonth: number;
  setNewMonth: (value: number) => void;
  newDay: number;
  setNewDay: (value: number) => void;
  draftColor: string;
  setDraftColor: (value: string) => void;
  draftLabel: string;
  setDraftLabel: (value: string) => void;
  draftIsBirthday: boolean;
  setDraftIsBirthday: (value: boolean) => void;
  onSave: () => void;
  onClose: () => void;
};

export const SpecialDateEditor = ({
  isOpen,
  isEditing,
  nowYear,
  newMonth,
  setNewMonth,
  newDay,
  setNewDay,
  draftColor,
  setDraftColor,
  draftLabel,
  setDraftLabel,
  draftIsBirthday,
  setDraftIsBirthday,
  onSave,
  onClose,
}: SpecialDateEditorProps) => {
  if (!isOpen) {
    return null;
  }

  const daysInMonth =
    DateTime.fromObject({ year: nowYear, month: newMonth }).daysInMonth ?? 31;

  return (
    <div className="mt-4 border border-[--accent]/30 bg-[--background] p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[--accent]">
          {isEditing ? "Edit Date" : "New Date"}
        </div>
        <button
          type="button"
          onClick={onClose}
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
            onChange={(event) => setNewMonth(Number(event.target.value))}
            className="w-full border-b border-[--border] bg-transparent px-1 py-2 text-sm text-[--foreground] outline-none transition focus:border-[--accent]"
          >
            {MONTHS_LONG.map((label, idx) => (
              <option
                key={label}
                value={idx + 1}
                className="bg-zinc-900 font-sans text-white"
              >
                {label}
              </option>
            ))}
          </select>
          <select
            value={newDay}
            onChange={(event) => setNewDay(Number(event.target.value))}
            className="w-full border-b border-[--border] bg-transparent px-1 py-2 font-mono text-sm text-[--foreground] outline-none transition focus:border-[--accent]"
          >
            {Array.from({ length: daysInMonth }, (_, idx) => (
              <option
                key={idx + 1}
                value={idx + 1}
                className="bg-zinc-900 font-mono text-white"
              >
                {idx + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
            Color
          </div>
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
            Label
          </span>
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
          onClick={onSave}
          className="flex-1 bg-[--accent] px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-widest text-[--background] transition hover:opacity-90"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-[--border] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[--foreground] transition hover:border-[--muted]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
