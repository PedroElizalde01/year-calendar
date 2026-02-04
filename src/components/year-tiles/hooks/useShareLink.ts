"use client";

import { useState } from "react";

import type { SpecialDay } from "@/lib/types";
import { DEFAULT_WALLPAPER_PRESET } from "../constants";

const buildCompactSpecials = (specialDays: SpecialDay[]) =>
  specialDays
    .map((item) => {
      const label = item.label
        ? encodeURIComponent(item.label)
            .replace(/-/g, "%2D")
            .replace(/~/g, "%7E")
        : "";
      const birthday = item.isBirthday ? "b" : "";
      return `${item.month}-${item.day}-${item.color.replace("#", "")}-${label}-${birthday}`;
    })
    .join("~");

export type ShareLinkState = {
  shareUrl: string;
  hasCopied: boolean;
  wallpaperPreset: string;
  setWallpaperPreset: (value: string) => void;
  handleShareLink: () => Promise<void>;
};

export const useShareLink = ({
  timeZone,
  specialDays,
  profileId,
  setProfileId,
}: {
  timeZone: string;
  specialDays: SpecialDay[];
  profileId: string | null;
  setProfileId: (value: string | null) => void;
}): ShareLinkState => {
  const [shareUrl, setShareUrl] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [wallpaperPreset, setWallpaperPreset] = useState(
    DEFAULT_WALLPAPER_PRESET,
  );

  const handleShareLink = async () => {
    const [width, height] = wallpaperPreset
      .split("x")
      .map((value) => Number(value));
    const payload = { timeZone, specialDays };
    let id = profileId;

    try {
      if (id) {
        const response = await fetch(`/api/profile/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("profile-update-failed");
        }
        const data = (await response.json()) as { id?: string };
        if (data.id && data.id !== id) {
          id = data.id;
          setProfileId(id);
        }
      } else {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("profile-create-failed");
        }
        const data = (await response.json()) as { id: string };
        id = data.id;
        setProfileId(id);
      }
    } catch {
      // Fallback to compact query if profile creation fails.
    }

    const url = new URL("/api/image", window.location.origin);
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    if (id) {
      url.searchParams.set("id", id);
    } else if (specialDays.length > 0) {
      url.searchParams.set("tz", timeZone);
      const compact = buildCompactSpecials(specialDays);
      url.searchParams.set("s", compact);
    }

    const link = url.toString();
    setShareUrl(link);

    try {
      await navigator.clipboard.writeText(link);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setHasCopied(false);
    }
  };

  return {
    shareUrl,
    hasCopied,
    wallpaperPreset,
    setWallpaperPreset,
    handleShareLink,
  };
};
