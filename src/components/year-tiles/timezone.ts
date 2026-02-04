export const getResolvedTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export const getSupportedTimeZones = (fallback: string) => {
  if (typeof Intl.supportedValuesOf === "function") {
    const zones = Intl.supportedValuesOf("timeZone");
    if (zones.length > 0) {
      return zones;
    }
  }

  return [fallback];
};
