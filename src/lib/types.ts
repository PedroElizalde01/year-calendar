export type SpecialDay = {
  month: number;
  day: number;
  color: string;
  label?: string;
  isBirthday?: boolean;
};

export type Settings = {
  timeZone: string;
  specialDays: SpecialDay[];
  profileId?: string;
};
