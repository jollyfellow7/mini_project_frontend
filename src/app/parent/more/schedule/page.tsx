'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchLockPolicy, updateFamilyProfile, updateLockPolicy } from '@/lib/chungsora/clientApi';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

function parseLockDays(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[,\s·/|]+/)
    .map((v) => v.trim())
    .filter((v) => WEEKDAYS.includes(v as (typeof WEEKDAYS)[number]));
}

function formatLockDays(days: string[]): string {
  return WEEKDAYS.filter((d) => days.includes(d)).join('·');
}

export default function MoreSchedulePage() {
  const lockTime = useSettingsStore((s) => s.lockTime);
  const lockDays = useSettingsStore((s) => s.lockDays);
  const setLockTime = useSettingsStore((s) => s.setLockTime);
  const setLockDays = useSettingsStore((s) => s.setLockDays);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const selectedDays = useMemo(() => parseLockDays(lockDays), [lockDays]);

  useEffect(() => {
    void fetchLockPolicy()
      .then((p) => {
        setLockTime(p.lock_time);
        setLockDays(p.lock_days);
      })
      .catch(() => undefined);
  }, [setLockTime, setLockDays]);

  const toggleDay = (day: string) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setLockDays(formatLockDays(next));
  };

  const save = async () => {
    if (saving) return;
    if (selectedDays.length === 0) {
      setStatusMsg('요일을 1개 이상 선택해 주세요.');
      return;
    }
    setSaving(true);
    setStatusMsg('저장 중...');
    try {
      await Promise.all([
        updateLockPolicy({ lock_time: lockTime, lock_days: lockDays }),
        updateFamilyProfile({ lock_time: lockTime, lock_days: lockDays }),
      ]);
      const latest = await fetchLockPolicy();
      setLockTime(latest.lock_time);
      setLockDays(latest.lock_days);
      setStatusMsg(`저장됨: ${latest.lock_days} ${latest.lock_time}`);
    } catch {
      setStatusMsg('저장 실패: 네트워크 상태를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
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
          <div className="mt-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={[
                    'rounded-lg border px-2 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'border-[#00b8cf] bg-[#e6f9fc] text-[#00a6bb]'
                      : 'border-[#eaedef] bg-white text-[#5f6b74]',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#828c94]">선택: {lockDays || '없음'}</p>
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

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="ch-btn-secondary w-full py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? '저장 중...' : '저장'}
        </button>

        {statusMsg ? <p className="text-xs text-[#5f6b74]">{statusMsg}</p> : null}
      </div>
    </div>
  );
}
