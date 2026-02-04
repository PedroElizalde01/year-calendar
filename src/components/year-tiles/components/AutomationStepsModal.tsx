export type AutomationStepsModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
};

export const AutomationStepsModal = ({
  isOpen,
  imageSrc,
  onClose,
}: AutomationStepsModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-10"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close automation steps"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[--border] bg-[--background]/70 text-[--muted] transition hover:text-[--foreground]"
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
        <img
          src={imageSrc}
          alt="Automation steps"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
};
