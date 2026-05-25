'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchLockPolicy, updateLockPolicy } from '@/lib/chungsora/clientApi';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function parseLockDays(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,\s·/|]+/)
    .map((s) => s.trim())
    .filter((d): d is (typeof WEEKDAYS)[number] => WEEKDAYS.includes(d as (typeof WEEKDAYS)[number]));
}

function normalizeLockDates(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a.localeCompare(b));
}

function parseTime(hhmm: string): { ampm: 'AM' | 'PM'; hour: number; minute: number } {
  const [h, m] = (hhmm || '17:00').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return { ampm: 'PM', hour: 5, minute: 0 };
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { ampm, hour, minute: m };
}

function toHHMM(ampm: 'AM' | 'PM', hour: number, minute: number): string {
  const normalizedHour = Math.max(1, Math.min(12, hour));
  const normalizedMinute = Math.max(0, Math.min(59, minute));
  const h24 =
    ampm === 'PM' && normalizedHour < 12
      ? normalizedHour + 12
      : ampm === 'AM' && normalizedHour === 12
        ? 0
        : normalizedHour;
  return `${String(h24).padStart(2, '0')}:${String(normalizedMinute).padStart(2, '0')}`;
}

export default function MoreSchedulePage() {
  const [lockDays, setLockDays] = useState<string[]>([]);
  const [lockDates, setLockDates] = useState<string[]>([]);
  const [time, setTime] = useState({ ampm: 'PM' as 'AM' | 'PM', hour: 5, minute: 0 });
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    void fetchLockPolicy()
      .then((p) => {
        setLockDays(parseLockDays(p.lock_days || ''));
        setLockDates(normalizeLockDates(p.lock_dates));
        setTime(parseTime(p.lock_time || '17:00'));
      })
      .catch(() => setToast('스케줄을 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const lockDaysText = useMemo(
    () => WEEKDAYS.filter((d) => lockDays.includes(d)).join('·'),
    [lockDays],
  );

  const toggleDay = (day: string) => {
    setLockDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const addDate = () => {
    if (!newDate) return;
    setLockDates((prev) => (prev.includes(newDate) ? prev : [...prev, newDate].sort((a, b) => a.localeCompare(b))));
    setNewDate('');
  };

  const removeDate = (date: string) => {
    setLockDates((prev) => prev.filter((d) => d !== date));
  };

  const save = async () => {
    if (lockDays.length === 0 && lockDates.length === 0) {
      setToast('요일 또는 특정 날짜를 1개 이상 선택해 주세요.');
      return;
    }
    setSaving(true);
    setToast('');
    try {
      await updateLockPolicy({
        lock_time: toHHMM(time.ampm, time.hour, time.minute),
        lock_days: lockDaysText,
        lock_dates: lockDates.join(','),
      });
      setToast('저장됐어요.');
    } catch {
      setToast('저장에 실패했습니다.');
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

      <div className="ch-card mt-6 space-y-5 p-5">
        <div>
          <label className="text-sm font-bold">요일</label>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((d) => {
              const active = lockDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={[
                    'rounded-lg border px-2 py-2 text-sm font-semibold',
                    active ? 'border-[#00b8cf] bg-[#e8f8fb] text-[#00b8cf]' : 'border-[#eaedef] text-[#828c94]',
                  ].join(' ')}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#828c94]">선택: {lockDaysText || '없음'}</p>
        </div>

        <div>
          <label className="text-sm font-bold">특정 날짜</label>
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 rounded-xl border border-[#eaedef] px-3 py-2.5 text-sm"
            />
            <button type="button" onClick={addDate} className="ch-btn-secondary px-3 py-2.5 text-sm">
              추가
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lockDates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => removeDate(d)}
                className="rounded-full bg-[#e8f8fb] px-3 py-1 text-xs font-semibold text-[#00b8cf]"
              >
                {d} ×
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold">시간</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <select
              value={time.ampm}
              onChange={(e) => setTime((prev) => ({ ...prev, ampm: e.target.value as 'AM' | 'PM' }))}
              className="rounded-xl border border-[#eaedef] px-3 py-3 text-sm"
            >
              <option value="AM">오전</option>
              <option value="PM">오후</option>
            </select>
            <select
              value={time.hour}
              onChange={(e) => setTime((prev) => ({ ...prev, hour: Number(e.target.value) }))}
              className="rounded-xl border border-[#eaedef] px-3 py-3 text-sm"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}시
                </option>
              ))}
            </select>
            <select
              value={time.minute}
              onChange={(e) => setTime((prev) => ({ ...prev, minute: Number(e.target.value) }))}
              className="rounded-xl border border-[#eaedef] px-3 py-3 text-sm"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}분
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-[#828c94]">
            저장 형식: {toHHMM(time.ampm, time.hour, time.minute)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="ch-btn-primary w-full py-3 text-sm disabled:opacity-60"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {toast ? (
        <p className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[#2f3438] px-4 py-2 text-xs text-white">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
