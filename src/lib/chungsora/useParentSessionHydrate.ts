'use client';

import { useEffect } from 'react';
import { fetchParentMe } from '@/lib/chungsora/clientApi';
import { useAuthStore } from '@/lib/chungsora/authStore';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

/** Shell 재마운트 시 30초 안에 다시 fetch 하지 않도록 모듈 레벨 타임스탬프 */
let lastFetchedAt = 0;
const COOLDOWN_MS = 30_000;

/** httpOnly 쿠키 세션 → zustand 동기화 */
export function useParentSessionHydrate() {
  const setParentSession = useAuthStore((s) => s.setParentSession);
  const setOnboardDone = useAuthStore((s) => s.setOnboardDone);
  const setLockTime = useSettingsStore((s) => s.setLockTime);
  const setLockDays = useSettingsStore((s) => s.setLockDays);
  const setPassScore = useSettingsStore((s) => s.setPassScore);
  const setBaseCleanWon = useSettingsStore((s) => s.setBaseCleanWon);

  useEffect(() => {
    const now = Date.now();
    if (now - lastFetchedAt < COOLDOWN_MS) return;
    lastFetchedAt = now;

    void fetchParentMe()
      .then((me) => {
        setParentSession({
          loginId: me.login_id,
          displayName: me.display_name,
          token: me.token,
          onboardDone: me.onboard_done,
        });
        setOnboardDone(me.onboard_done);
        setLockTime(me.lock_time);
        setLockDays(me.lock_days);
        setPassScore(me.pass_score);
        setBaseCleanWon(me.base_clean_won);
      })
      .catch(() => undefined);
  }, [
    setParentSession,
    setOnboardDone,
    setLockTime,
    setLockDays,
    setPassScore,
    setBaseCleanWon,
  ]);
}
