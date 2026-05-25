'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchLockPolicy } from '@/lib/chungsora/clientApi';
import { useCleaningSessionStore } from '@/lib/chungsora/cleaningSessionStore';

type LockPolicyLite = {
  lock_time: string;
  lock_days: string;
  lock_dates: string;
};

const DAY_MAP: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

function toTodayKey(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function useLockState() {
  const [policy, setPolicy] = useState<LockPolicyLite | null>(null);
  const phase = useCleaningSessionStore((s) => s.phase);

  useEffect(() => {
    void fetchLockPolicy()
      .then((p) => {
        setPolicy({
          lock_time: p.lock_time || '17:00',
          lock_days: p.lock_days || '',
          lock_dates: p.lock_dates || '',
        });
      })
      .catch(() => undefined);
  }, []);

  return useMemo(() => {
    if (!policy) return false;
    if (phase === 'unlock') return false;

    const now = new Date();
    const todayDay = DAY_MAP[now.getDay()];
    const dayMatch = policy.lock_days
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(todayDay);

    const todayKey = toTodayKey(now);
    const dateMatch = policy.lock_dates
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(todayKey);

    if (!dayMatch && !dateMatch) return false;

    const [hRaw, mRaw] = policy.lock_time.split(':').map(Number);
    const lockAt = new Date(now);
    lockAt.setHours(Number.isNaN(hRaw) ? 17 : hRaw, Number.isNaN(mRaw) ? 0 : mRaw, 0, 0);
    return now >= lockAt;
  }, [phase, policy]);
}
