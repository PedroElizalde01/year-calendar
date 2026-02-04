export type AutomationStepsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const AutomationStepsModal = ({
  isOpen,
  onClose,
}: AutomationStepsModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl border border-[--border] bg-[--surface]/50 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[--muted]">
          Automation (iOS Shortcuts)
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close automation steps"
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
      <div className="mt-4 space-y-2 text-xs text-[--muted]">
        <p className="font-mono uppercase tracking-wider text-[10px] text-[--muted]">
          Create Automation
        </p>
        <p>
          Open <span className="text-[--foreground]">Shortcuts</span> →{" "}
          <span className="text-[--foreground]">Automation</span> tab →{" "}
          <span className="text-[--foreground]">New Automation</span> →{" "}
          <span className="text-[--foreground]">Time of Day</span> →{" "}
          <span className="text-[--foreground]">00:00 AM</span> → Repeat{" "}
          <span className="text-[--foreground]">Daily</span> →{" "}
          <span className="text-[--foreground]">Run Immediately</span> →{" "}
          <span className="text-[--foreground]">Create New Shortcut</span>
        </p>
        <p className="font-mono uppercase tracking-wider text-[10px] text-[--muted]">
          Create Shortcut
        </p>
        <p>
          Add action <span className="text-[--foreground]">Get Contents of URL</span>{" "}
          → paste the Automation Link.
        </p>
        <p>
          Add action <span className="text-[--foreground]">Set Wallpaper Photo</span>{" "}
          → choose <span className="text-[--foreground]">Lock Screen</span>.
        </p>
        <div className="mt-3 border border-[--border] bg-[--background]/60 p-3 text-[11px] text-amber-300">
          <span className="font-mono uppercase tracking-wider">Important:</span>{" "}
          In <span className="text-amber-100">Set Wallpaper Photo</span>, tap the arrow (→) to
          show options, then disable <span className="text-amber-100">Crop to Subject</span>{" "}
          and <span className="text-amber-100">Show Preview</span>.
        </div>
      </div>
    </div>
  );
};
