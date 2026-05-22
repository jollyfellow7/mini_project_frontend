'use client';

import { create } from 'zustand';
import {
  DEFAULT_COACH_ID,
  normalizeCoachCharacterId,
  type CoachCharacterId,
} from '@/lib/chungsora/coachCharacters';

/** 세션 중 캐시 — 값은 API(Neon)에서만 채움 */
type SettingsState = {
  baseCleanWon: number;
  passScore: number;
  lockTime: string;
  lockDays: string;
  allowPhone: boolean;
  coachCharacterId: CoachCharacterId;
  childCoachCharacterId: CoachCharacterId | null;
  /** family 기본 반말 모드 */
  coachInformalMode: boolean;
  /** 자녀 오버라이드 반말 모드 (null = 자녀 미설정) */
  childCoachInformalMode: boolean | null;
  setBaseCleanWon: (won: number) => void;
  setPassScore: (score: number) => void;
  setLockTime: (time: string) => void;
  setLockDays: (days: string) => void;
  setAllowPhone: (v: boolean) => void;
  setCoachIds: (familyDefault: string | undefined, childOverride: string | null) => void;
  setCoachInformal: (familyInformal: boolean, childInformal: boolean | null) => void;
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  baseCleanWon: 0,
  passScore: 0,
  lockTime: '',
  lockDays: '',
  allowPhone: true,
  coachCharacterId: DEFAULT_COACH_ID,
  childCoachCharacterId: null,
  coachInformalMode: false,
  childCoachInformalMode: null,
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
  setCoachInformal: (familyInformal, childInformal) =>
    set({
      coachInformalMode: !!familyInformal,
      childCoachInformalMode: childInformal == null ? null : !!childInformal,
    }),
}));
