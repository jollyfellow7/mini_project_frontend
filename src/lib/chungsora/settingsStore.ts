'use client';

import { create } from 'zustand';
import { normalizeCoachCharacterId, type CoachCharacterId } from '@/lib/chungsora/coachCharacters';

/** 세션 중 캐시 — 값은 API(Neon)에서만 채움 */
type SettingsState = {
  baseCleanWon: number;
  passScore: number;
  lockTime: string;
  lockDays: string;
  allowPhone: boolean;
  coachCharacterId: CoachCharacterId;
  childCoachCharacterId: CoachCharacterId | null;
  setBaseCleanWon: (won: number) => void;
  setPassScore: (score: number) => void;
  setLockTime: (time: string) => void;
  setLockDays: (days: string) => void;
  setAllowPhone: (v: boolean) => void;
  setCoachIds: (familyDefault: string | undefined, childOverride: string | null) => void;
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  baseCleanWon: 0,
  passScore: 0,
  lockTime: '',
  lockDays: '',
  allowPhone: true,
  coachCharacterId: 'jiu',
  childCoachCharacterId: null,
  setBaseCleanWon: (won) => set({ baseCleanWon: won }),
  setPassScore: (score) => set({ passScore: score }),
  setLockTime: (time) => set({ lockTime: time }),
  setLockDays: (days) => set({ lockDays: days }),
  setAllowPhone: (v) => set({ allowPhone: v }),
  setCoachIds: (familyDefault, childOverride) =>
    set({
      coachCharacterId: normalizeCoachCharacterId(familyDefault),
      childCoachCharacterId: childOverride
        ? normalizeCoachCharacterId(childOverride)
        : null,
    }),
}));
