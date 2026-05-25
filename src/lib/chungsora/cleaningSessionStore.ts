'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuestItem = { id: string; label: string; done: boolean };

export type SessionPhase =
  | 'idle'
  | 'dirty'
  | 'scanning'
  | 'quest'
  | 'after'
  | 'verifying'
  | 'unlock';

type CleaningSessionState = {
  phase: SessionPhase;
  questItems: QuestItem[];
  pollutionLevel: number;
  scanSummary: string;
  hasScanResult: boolean;
  cleanliness: number;
  verifyComment: string;
  streakDays: number;
  setPhase: (phase: SessionPhase) => void;
  setScanResult: (items: QuestItem[], pollution: number, summary: string) => void;
  toggleQuestItem: (id: string) => void;
  setVerifyResult: (cleanliness: number, comment: string) => void;
  setStreakDays: (days: number) => void;
  resetSession: () => void;
  allQuestDone: () => boolean;
};

export const useCleaningSessionStore = create<CleaningSessionState>()(
  persist(
    (set, get) => ({
      phase: 'idle',
      questItems: [],
      pollutionLevel: 0,
      scanSummary: '',
      hasScanResult: false,
      cleanliness: 0,
      verifyComment: '',
      streakDays: 0,
      setPhase: (phase) => set({ phase }),
      setScanResult: (items, pollution, summary) =>
        set({
          questItems: items,
          pollutionLevel: pollution,
          scanSummary: summary,
          hasScanResult: true,
          phase: 'quest',
        }),
      toggleQuestItem: (id) =>
        set((s) => ({
          questItems: s.questItems.map((q) => (q.id === id ? { ...q, done: !q.done } : q)),
        })),
      setVerifyResult: (cleanliness, comment) =>
        set({ cleanliness, verifyComment: comment, phase: 'unlock' }),
      setStreakDays: (days) => set({ streakDays: Math.max(0, days) }),
      resetSession: () =>
        set((s) => ({
          phase: 'idle',
          questItems: [],
          pollutionLevel: 0,
          scanSummary: '',
          hasScanResult: false,
          cleanliness: 0,
          verifyComment: '',
          streakDays: s.streakDays,
        })),
      allQuestDone: () => {
        const items = get().questItems;
        return items.length > 0 && items.every((q) => q.done);
      },
    }),
    { name: 'chungsora-session-v2' },
  ),
);
