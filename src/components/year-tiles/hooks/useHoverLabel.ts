"use client";

import { useState } from "react";

export type HoverState = {
  hoverLabel: string;
  hoverPos: { x: number; y: number };
  handleHover: (
    label: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  handleHoverMove: (event: React.MouseEvent<HTMLButtonElement>) => void;
  clearHover: () => void;
};

export const useHoverLabel = (): HoverState => {
  const [hoverLabel, setHoverLabel] = useState("");
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

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

  return { hoverLabel, hoverPos, handleHover, handleHoverMove, clearHover };
};
