'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchLockPolicy } from '@/lib/chungsora/clientApi';
import { ChevronRight } from 'lucide-react';
import { logoutParent } from '@/lib/chungsora/authStore';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

export default function ParentMorePage() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const lockTime = useSettingsStore((s) => s.lockTime);
  const lockDays = useSettingsStore((s) => s.lockDays);
  const passScore = useSettingsStore((s) => s.passScore);
  const allowPhone = useSettingsStore((s) => s.allowPhone);
  const setLockTime = useSettingsStore((s) => s.setLockTime);
  const setLockDays = useSettingsStore((s) => s.setLockDays);
  const setPassScore = useSettingsStore((s) => s.setPassScore);
  const setAllowPhone = useSettingsStore((s) => s.setAllowPhone);

  useEffect(() => {
    void fetchLockPolicy()
      .then((p) => {
        setLockTime(p.lock_time);
        setLockDays(p.lock_days);
        setPassScore(p.pass_score);
        setAllowPhone(p.allow_phone);
      })
      .catch(() => undefined);
  }, [setLockTime, setLockDays, setPassScore, setAllowPhone]);

  const rows = [
    {
      section: '청소 · 잠금',
      items: [
        { label: '청소 스케줄', href: '/parent/more/schedule', trailing: `${lockDays} ${lockTime}` },
        { label: '잠금 해제 기준', href: '/parent/more/lock', trailing: `${passScore}점` },
        { label: '잠금 중 허용', href: '/parent/more/lock', trailing: allowPhone ? '전화 ON' : '전화 OFF' },
        { label: '자녀 관리 · 연결 코드', href: '/parent/more/pair' },
        { label: '새 휴대폰 연결 (폰 교체)', href: '/parent/pair/relink' },
        { label: '커스텀 칭찬 관리', href: '/parent/more/praise' },
      ],
    },
    {
      section: '앱 · 계정',
      items: [
        { label: '알림 설정', href: '/parent/more/notifications' },
        { label: '로그아웃', action: 'logout' as const },
        { label: '버전', trailing: '1.0.0' },
        { label: '이용약관 · 개인정보', href: '/parent/more/legal' },
      ],
    },
  ];

  const handleLogout = () => {
    logoutParent();
    router.replace('/parent/login');
  };

  return (
    <>
      <header className="px-5 pb-2 pt-4">
        <h1 className="text-[22px] font-bold text-[#1a1e22]">더보기</h1>
        <p className="mt-1 text-[13px] text-[#828c94]">설정 · 계정 · 앱 정보</p>
      </header>

      <div className="flex flex-col gap-4 px-5 pb-6">
        {rows.map(({ section, items }) => (
          <div key={section} className="ch-card overflow-hidden">
            <p className="border-b border-[#f0f2f4] px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-[#adb5bd]">
              {section}
            </p>
            <ul>
              {items.map((item) => (
                <li key={item.label} className="border-b border-[#f7f9fa] last:border-0">
                  {'action' in item && item.action === 'logout' ? (
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px] text-[#e03131] hover:bg-[#fff8f8]"
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={16} className="text-[#e03131] opacity-50" />
                    </button>
                  ) : 'href' in item && item.href ? (
                    <Link
                      href={item.href}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px] text-[#1a1e22] hover:bg-[#f7f9fa]"
                    >
                      <span>{item.label}</span>
                      <span className="flex items-center gap-1.5 text-[#adb5bd]">
                        {'trailing' in item && item.trailing ? (
                          <span className="text-[13px] text-[#828c94]">{item.trailing}</span>
                        ) : null}
                        <ChevronRight size={16} />
                      </span>
                    </Link>
                  ) : (
                    <div className="flex w-full items-center justify-between px-4 py-3.5 text-[14px] text-[#1a1e22]">
                      <span>{item.label}</span>
                      {'trailing' in item && item.trailing ? (
                        <span className="text-[13px] text-[#828c94]">{item.trailing}</span>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showLogoutConfirm ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pb-2 pt-6 text-center">
              <p className="text-[17px] font-bold text-[#1a1e22]">로그아웃할까요?</p>
              <p className="mt-1.5 text-[14px] text-[#828c94]">로그아웃해도 데이터는 유지돼요.</p>
            </div>
            <div className="mt-4 flex divide-x divide-[#f0f2f4] border-t border-[#f0f2f4]">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-4 text-[15px] font-semibold text-[#828c94]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-4 text-[15px] font-bold text-[#e03131]"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
