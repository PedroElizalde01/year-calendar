export type AutomationLinkCardProps = {
  shareUrl: string;
  hasCopied: boolean;
  profileId: string | null;
  onGenerate: () => void;
  onCopy: () => void;
};

export const AutomationLinkCard = ({
  shareUrl,
  hasCopied,
  profileId,
  onGenerate,
  onCopy,
}: AutomationLinkCardProps) => (
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
        onClick={onCopy}
        disabled={!shareUrl}
        className="shrink-0 border border-[--border] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[--foreground] transition hover:border-[--accent] hover:text-[--accent] disabled:cursor-default disabled:opacity-40 disabled:hover:border-[--border] disabled:hover:text-[--muted]"
      >
        Copy
      </button>
    </div>
  </div>
);
