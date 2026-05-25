'use client';

import { create } from 'zustand';
import { fetchFamilySummary, type FamilySummary } from '@/lib/chungsora/clientApi';

const DEFAULT_COOLDOWN_MS = 30_000;
let inFlight: Promise<FamilySummary | null> | null = null;

type RefreshOptions = {
  force?: boolean;
  cooldownMs?: number;
};

type FamilySummaryState = {
  summary: FamilySummary | null;
  lastFetchedAt: number;
  setSummary: (summary: FamilySummary | null) => void;
  refreshSummary: (options?: RefreshOptions) => Promise<FamilySummary | null>;
};

export const useFamilySummaryStore = create<FamilySummaryState>()((set, get) => ({
  summary: null,
  lastFetchedAt: 0,
  setSummary: (summary) => set({ summary, lastFetchedAt: Date.now() }),
  refreshSummary: async (options) => {
    const cooldownMs = options?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const force = !!options?.force;
    const now = Date.now();
    const cached = get().summary;

    if (!force && cached && now - get().lastFetchedAt < cooldownMs) {
      return cached;
    }

    if (inFlight) return inFlight;

    inFlight = fetchFamilySummary()
      .then((summary) => {
        set({ summary, lastFetchedAt: Date.now() });
        return summary;
      })
      .catch(() => get().summary)
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },
}));
