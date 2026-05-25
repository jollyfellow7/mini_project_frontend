'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchLogCalendar } from '@/lib/chungsora/clientApi';
import { toLogDateParam } from '@/lib/chungsora/logV2';
import { setRole, type ChungsoraRole } from '@/lib/chungsora/role';
import { deferEffect } from '@/lib/react/deferEffect';

const DAYS = ['\uc77c', '\uc6d4', '\ud654', '\uc218', '\ubaa9', '\uae08', '\ud1a0'] as const;

type CleaningCalendarProps = {
  points?: number;
  role?: ChungsoraRole;
};

export function CleaningCalendar({ points: pointsProp = 0, role = 'parent' }: CleaningCalendarProps) {
  // useState 초기화 함수로 안정적인 참조 확보 — 매 렌더마다 new Date() 재생성 방지
  const [now] = useState(() => new Date());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [cleanedSet, setCleanedSet] = useState<Set<string>>(new Set());
  const [monthPoints, setMonthPoints] = useState(pointsProp);

  const loadCalendar = useCallback(async () => {
    try {
      const res = await fetchLogCalendar(viewYear, viewMonth);
      setCleanedSet(new Set(res.dates ?? []));
      if (res.points) setMonthPoints(res.points);
    } catch {
      setCleanedSet(new Set());
      setMonthPoints(0);
    }
    // now·pointsProp 는 loadCalendar 내부에서 사용하지 않으므로 의존 배열에서 제외
  }, [viewYear, viewMonth]);

  useEffect(() => {
    deferEffect(() => {
      void loadCalendar();
    });
  }, [loadCalendar]);

  const { cells } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return { cells: result };
  }, [viewYear, viewMonth]);

  const isTodayDate = (day: number) =>
    viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1 && day === now.getDate();

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth() + 1);
  };

  const handleDayClick = () => {
    if (role === 'child') setRole('child');
    else setRole('parent');
  };

  return (
    <div className="ch-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#828c94] hover:bg-[#f0f2f4]"
            aria-label="\uc774\uc804 \ub2ec"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[96px] text-center text-sm font-bold text-[#2f3438]">
            {viewYear}\ub144 {viewMonth}\uc6d4
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#828c94] hover:bg-[#f0f2f4]"
            aria-label="\ub2e4\uc74c \ub2ec"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <span className="text-sm font-bold text-[#00b8cf]">{monthPoints}P</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#adb5bd]">
        {DAYS.map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={`e-${i}`} />;

          const dateKey = toLogDateParam(new Date(viewYear, viewMonth - 1, day));
          const cleaned = cleanedSet.has(dateKey);
          const isToday = isTodayDate(day);

          const cellClass = isToday
            ? 'border-2 border-[#00B8CF] bg-white text-[#00B8CF] font-bold'
            : cleaned
              ? 'bg-[#00B8CF] text-white font-semibold'
              : 'text-[#828c94] hover:bg-[#f0f2f4]';

          return (
            <Link
              key={dateKey}
              href={`/log?date=${dateKey}`}
              onClick={handleDayClick}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors ${cellClass}`}
            >
              <span>{day}</span>
              {cleaned && !isToday && <span className="text-[9px] leading-none">\u2713</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
