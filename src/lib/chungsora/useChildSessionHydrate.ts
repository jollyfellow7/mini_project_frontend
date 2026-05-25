'use client';

import { useEffect } from 'react';
import { fetchLockPolicy } from '@/lib/chungsora/clientApi';
import { tryRefreshChildSession } from '@/lib/chungsora/childSessionRefresh';
import { useAuthStore } from '@/lib/chungsora/authStore';
import { useCleaningSessionStore } from '@/lib/chungsora/cleaningSessionStore';
import { useFamilySummaryStore } from '@/lib/chungsora/familySummaryStore';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

let lastFetchedAt = 0;
const COOLDOWN_MS = 30_000;

export function useChildSessionHydrate() {
  const childPaired = useAuthStore((s) => s.childPaired);
  const setChildPaired = useAuthStore((s) => s.setChildPaired);
  const setLockTime = useSettingsStore((s) => s.setLockTime);
  const setLockDays = useSettingsStore((s) => s.setLockDays);
  const setPassScore = useSettingsStore((s) => s.setPassScore);
  const setAllowPhone = useSettingsStore((s) => s.setAllowPhone);
  const setBaseCleanWon = useSettingsStore((s) => s.setBaseCleanWon);
  const setCoachIds = useSettingsStore((s) => s.setCoachIds);
  const setStreakDays = useCleaningSessionStore((s) => s.setStreakDays);
  const refreshSummary = useFamilySummaryStore((s) => s.refreshSummary);

  useEffect(() => {
    const now = Date.now();
    const stale = now - lastFetchedAt >= COOLDOWN_MS;

    if (stale) {
      lastFetchedAt = now;
      const deviceId = useAuthStore.getState().childDeviceId;
      if (deviceId) void tryRefreshChildSession();

      void fetchLockPolicy()
        .then((p) => {
          setLockTime(p.lock_time);
          setLockDays(p.lock_days);
          setPassScore(p.pass_score);
          setAllowPhone(p.allow_phone);
        })
        .catch(() => undefined);
    }

    if (!stale && childPaired) return;

    void refreshSummary({ force: stale })
      .then((summary) => {
        if (!summary) return;
        if (!childPaired) setChildPaired(true);
        setBaseCleanWon(summary.base_clean_won);
        setPassScore(summary.pass_score);
        setCoachIds(summary.coach_character_id, summary.child_coach_character_id ?? null);
        setStreakDays(summary.streak_days ?? 0);
      })
      .catch(() => undefined);
  }, [
    childPaired,
    setChildPaired,
    setLockTime,
    setLockDays,
    setPassScore,
    setAllowPhone,
    setBaseCleanWon,
    setCoachIds,
    setStreakDays,
    refreshSummary,
  ]);
}
