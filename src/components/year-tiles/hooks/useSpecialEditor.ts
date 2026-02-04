"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";

import type { SpecialDay } from "@/lib/types";
import { DEFAULT_SPECIAL_COLOR } from "../constants";

export type SpecialEditorState = {
  isEditorOpen: boolean;
  editingDateISO: string | null;
  draftColor: string;
  setDraftColor: (value: string) => void;
  draftLabel: string;
  setDraftLabel: (value: string) => void;
  draftIsBirthday: boolean;
  setDraftIsBirthday: (value: boolean) => void;
  newMonth: number;
  setNewMonth: (value: number) => void;
  newDay: number;
  setNewDay: (value: number) => void;
  sortedSpecialDays: SpecialDay[];
  openEditor: (dateISO: string) => void;
  openAddForm: () => void;
  closeEditor: () => void;
  handleSave: () => void;
  handleDeleteSpecial: (month: number, day: number) => void;
};

export const useSpecialEditor = ({
  now,
  timeZone,
  specialDays,
  setSpecialDays,
  specialByDate,
}: {
  now: DateTime;
  timeZone: string;
  specialDays: SpecialDay[];
  setSpecialDays: Dispatch<SetStateAction<SpecialDay[]>>;
  specialByDate: Record<string, SpecialDay>;
}): SpecialEditorState => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDateISO, setEditingDateISO] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(DEFAULT_SPECIAL_COLOR);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftIsBirthday, setDraftIsBirthday] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(() => now.month);
  const [newDay, setNewDay] = useState<number>(() => now.day);

  const resetDraft = () => {
    setDraftColor(DEFAULT_SPECIAL_COLOR);
    setDraftLabel("");
    setDraftIsBirthday(false);
  };

  const openEditor = (dateISO: string) => {
    const selected = DateTime.fromISO(dateISO).setZone(timeZone);
    if (!selected.isValid) {
      return;
    }
    setEditingDateISO(dateISO);
    setNewMonth(selected.month);
    setNewDay(selected.day);
    const existing = specialByDate[dateISO];
    if (existing) {
      setDraftColor(existing.color);
      setDraftLabel(existing.label ?? "");
      setDraftIsBirthday(Boolean(existing.isBirthday));
    } else {
      resetDraft();
    }
    setIsEditorOpen(true);
  };

  const openAddForm = () => {
    const current = DateTime.now().setZone(timeZone);
    setNewMonth(current.month);
    setNewDay(current.day);
    setEditingDateISO(null);
    resetDraft();
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingDateISO(null);
    resetDraft();
  };

  const handleSave = () => {
    const selected = DateTime.fromObject(
      {
        year: now.year,
        month: newMonth,
        day: newDay,
      },
      { zone: timeZone },
    );
    if (!selected.isValid) {
      return;
    }

    const trimmedLabel = draftLabel.trim();
    const special: SpecialDay = {
      month: newMonth,
      day: newDay,
      color: draftColor,
      label: trimmedLabel.length > 0 ? trimmedLabel : undefined,
      isBirthday: draftIsBirthday ? true : undefined,
    };

    setSpecialDays((prev) => {
      const filtered = prev.filter((item) => {
        if (item.month === special.month && item.day === special.day) {
          return false;
        }
        if (editingDateISO) {
          const editing = DateTime.fromISO(editingDateISO).setZone(timeZone);
          if (
            editing.isValid &&
            (editing.month !== special.month || editing.day !== special.day)
          ) {
            return !(item.month === editing.month && item.day === editing.day);
          }
        }
        return true;
      });
      return [...filtered, special].sort((a, b) =>
        a.month === b.month ? a.day - b.day : a.month - b.month,
      );
    });
    setIsEditorOpen(false);
    setEditingDateISO(null);
  };

  const handleDeleteSpecial = (month: number, day: number) => {
    setSpecialDays((prev) =>
      prev.filter((item) => !(item.month === month && item.day === day)),
    );
    if (editingDateISO) {
      const editing = DateTime.fromISO(editingDateISO).setZone(timeZone);
      if (editing.isValid && editing.month === month && editing.day === day) {
        setIsEditorOpen(false);
        setEditingDateISO(null);
        resetDraft();
      }
    }
  };

  const sortedSpecialDays = useMemo(
    () =>
      [...specialDays].sort((a, b) =>
        a.month === b.month ? a.day - b.day : a.month - b.month,
      ),
    [specialDays],
  );

  return {
    isEditorOpen,
    editingDateISO,
    draftColor,
    setDraftColor,
    draftLabel,
    setDraftLabel,
    draftIsBirthday,
    setDraftIsBirthday,
    newMonth,
    setNewMonth,
    newDay,
    setNewDay,
    sortedSpecialDays,
    openEditor,
    openAddForm,
    closeEditor,
    handleSave,
    handleDeleteSpecial,
  };
};
