'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchLockPolicy } from '@/lib/chungsora/clientApi';
import {
  useCleaningSessionStore,
  type SessionPhase,
} from '@/lib/chungsora/cleaningSessionStore';

/** 잠금 시간이어도 청소 미션·해제 플로우는 막지 않음 */
const MISSION_PHASES = new Set<SessionPhase>([
  'dirty',
  'scanning',
  'quest',
  'after',
  'verifying',
  'unlock',
]);

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

function applyPolicy(p: { lock_time?: string; lock_days?: string; lock_dates?: string }) {
  return {
    lock_time: p.lock_time || '17:00',
    lock_days: p.lock_days || '',
    lock_dates: p.lock_dates || '',
  };
}

export function useLockState() {
  const [policy, setPolicy] = useState<LockPolicyLite | null>(null);
  const [tick, setTick] = useState(() => new Date());
  const phase = useCleaningSessionStore((s) => s.phase);

  // 정책 fetch (최초 + 60초마다 갱신, 실패 시 5초 후 재시도)
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const load = () => {
      void fetchLockPolicy()
        .then((p) => {
          if (!cancelled) setPolicy(applyPolicy(p));
        })
        .catch(() => {
          if (!cancelled) {
            retryTimer = setTimeout(load, 5_000);
          }
        });
    };

    load();
    const interval = setInterval(load, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // 30초마다 현재 시각을 갱신하여 잠금 시간이 되면 자동으로 감지
  useEffect(() => {
    const t = setInterval(() => setTick(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    if (!policy) return false;
    // 잠금 시간이 지나도 청소 미션 진행 중에는 UI 잠금·리다이렉트 하지 않음
    if (MISSION_PHASES.has(phase)) return false;

    const now = tick;
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
  }, [phase, policy, tick]);
}
