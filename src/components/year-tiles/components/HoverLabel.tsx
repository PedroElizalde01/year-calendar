export type HoverLabelProps = {
  label: string;
  x: number;
  y: number;
};

export const HoverLabel = ({ label, x, y }: HoverLabelProps) => (
  <div
    className="pointer-events-none fixed z-50 border border-[--border] bg-[--surface] px-2 py-1 font-mono text-[10px] text-[--foreground] shadow-lg"
    style={{ left: x + 12, top: y + 12 }}
  >
    {label}
  </div>
);
