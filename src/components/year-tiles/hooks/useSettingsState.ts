"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";

import { loadSettings, saveSettings } from "@/lib/storage";
import type { SpecialDay } from "@/lib/types";
import { DEFAULT_TIME_ZONE } from "../constants";
import { getResolvedTimeZone, getSupportedTimeZones } from "../timezone";

export type SettingsState = {
  timeZone: string;
  setTimeZone: (value: string) => void;
  specialDays: SpecialDay[];
  setSpecialDays: Dispatch<SetStateAction<SpecialDay[]>>;
  now: DateTime;
  profileId: string | null;
  setProfileId: (value: string | null) => void;
  timeZoneOptions: string[];
};

export const useSettingsState = (): SettingsState => {
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [now, setNow] = useState(() =>
    DateTime.now().setZone(DEFAULT_TIME_ZONE),
  );
  const [profileId, setProfileId] = useState<string | null>(null);
  const [timeZoneOptions, setTimeZoneOptions] = useState<string[]>([]);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const resolved = getResolvedTimeZone();
    const settings = loadSettings(resolved);
    setTimeZone(settings.timeZone);
    setSpecialDays(settings.specialDays);
    setNow(DateTime.now().setZone(settings.timeZone));
    setProfileId(settings.profileId ?? null);

    const zones = getSupportedTimeZones(resolved);
    setTimeZoneOptions(
      zones.includes(settings.timeZone)
        ? zones
        : [settings.timeZone, ...zones],
    );
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    saveSettings({ timeZone, specialDays, profileId: profileId ?? undefined });
  }, [timeZone, specialDays, profileId]);

  useEffect(() => {
    setNow(DateTime.now().setZone(timeZone));
  }, [timeZone]);

  const todayKey = now.toISODate();

  useEffect(() => {
    const current = DateTime.now().setZone(timeZone);
    const nextMidnight = current.plus({ days: 1 }).startOf("day");
    const msUntilNext = Math.max(nextMidnight.diff(current).toMillis(), 0);
    const timeoutId = window.setTimeout(() => {
      setNow(DateTime.now().setZone(timeZone));
    }, msUntilNext + 25);

    return () => window.clearTimeout(timeoutId);
  }, [timeZone, todayKey]);

  useEffect(() => {
    setTimeZoneOptions((prev) =>
      prev.includes(timeZone) ? prev : [timeZone, ...prev],
    );
  }, [timeZone]);

  return {
    timeZone,
    setTimeZone,
    specialDays,
    setSpecialDays,
    now,
    profileId,
    setProfileId,
    timeZoneOptions,
  };
};
