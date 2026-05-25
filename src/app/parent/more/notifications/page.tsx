'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchParentMe, updateFamilyProfile } from '@/lib/chungsora/clientApi';

type Prefs = {
  cleaning_done: boolean;
  proposal: boolean;
  streak: boolean;
};

const LABELS: { key: keyof Prefs; label: string }[] = [
  { key: 'cleaning_done', label: '청소 완료' },
  { key: 'proposal', label: '제안 도착' },
  { key: 'streak', label: '스트릭 알림' },
];

export default function MoreNotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    cleaning_done: true,
    proposal: true,
    streak: true,
  });

  useEffect(() => {
    void fetchParentMe()
      .then((me) => {
        if (me.notification_prefs) setPrefs(me.notification_prefs as Prefs);
      })
      .catch(() => undefined);
  }, []);

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    void updateFamilyProfile({ notification_prefs: next }).catch(() => undefined);
  };

  return (
    <div className="px-5 py-6">
      <Link href="/parent/more" className="text-xs font-semibold text-[#00b8cf]">
        ← 더보기
      </Link>
      <h1 className="mt-3 text-xl font-bold text-[#2f3438]">알림 설정</h1>
      <p className="mt-1 text-xs text-[#828c94]">앱 알림 수신 여부를 설정하세요</p>
      <div className="ch-card mt-6 divide-y divide-[#f0f2f4]">
        {LABELS.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between px-4 py-4 text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={() => toggle(key)}
              className="h-5 w-5 accent-[#00b8cf]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
