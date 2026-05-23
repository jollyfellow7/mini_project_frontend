'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { fetchLockPolicy, updateLockPolicy, updateFamilyProfile } from '@/lib/chungsora/clientApi';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

export default function MoreSchedulePage() {
  const lockTime = useSettingsStore((s) => s.lockTime);
  const lockDays = useSettingsStore((s) => s.lockDays);
  const setLockTime = useSettingsStore((s) => s.setLockTime);
  const setLockDays = useSettingsStore((s) => s.setLockDays);

  useEffect(() => {
    void fetchLockPolicy()
      .then((p) => {
        setLockTime(p.lock_time);
        setLockDays(p.lock_days);
      })
      .catch(() => undefined);
  }, [setLockTime, setLockDays]);

  const save = () => {
    void updateLockPolicy({ lock_time: lockTime, lock_days: lockDays }).catch(() => undefined);
    void updateFamilyProfile({ lock_time: lockTime, lock_days: lockDays }).catch(() => undefined);
  };

  return (
    <div className="px-5 py-6">
      <Link href="/parent/more" className="text-xs font-semibold text-[#00b8cf]">
        ← 더보기
      </Link>
      <h1 className="mt-3 text-xl font-bold text-[#2f3438]">청소 스케줄</h1>
      <div className="ch-card mt-6 space-y-4 p-5">
        <div>
          <label className="text-sm font-bold">요일</label>
          <input
            value={lockDays}
            onChange={(e) => setLockDays(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#eaedef] px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold">시간</label>
          <input
            type="time"
            value={lockTime}
            onChange={(e) => setLockTime(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#eaedef] px-4 py-3 text-sm"
          />
        </div>
        <button type="button" onClick={save} className="ch-btn-secondary w-full py-2.5 text-sm">
          저장
        </button>
      </div>
    </div>
  );
}
