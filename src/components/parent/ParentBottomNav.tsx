'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, ClipboardList, Handshake, Gift, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BottomNavIcon } from '@/components/chungsora/BottomNavIcon';

type TabId = 'home' | 'log' | 'propose' | 'rewards' | 'more';

const LEFT: { id: TabId; label: string; href: string; Icon: LucideIcon; filledWhenActive?: boolean }[] = [
  { id: 'home', label: '홈', href: '/parent/home', Icon: Home, filledWhenActive: true },
  { id: 'log', label: '로그', href: '/log', Icon: ClipboardList },
];

const RIGHT: { id: TabId; label: string; href: string; Icon: LucideIcon; filledWhenActive?: boolean }[] = [
  { id: 'rewards', label: '보상', href: '/parent/rewards', Icon: Gift },
  { id: 'more', label: '더보기', href: '/parent/more', Icon: Menu },
];

const ALL_HREFS = [...LEFT.map((t) => t.href), '/propose', ...RIGHT.map((t) => t.href)];

function tabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function tabLabelClass(active: boolean) {
  return `text-[10px] ${active ? 'font-semibold text-[#1a1e22]' : 'font-normal text-[#8e8e8e]'}`;
}

export function ParentBottomNav({ proposeBadge }: { proposeBadge?: number }) {
  const pathname = usePathname();
  // 클릭 직후 즉시 active 상태 반영 — pathname 업데이트를 기다리지 않음
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function isOn(href: string) {
    // pathname이 아직 pendingHref로 바뀌지 않은 동안만 pending을 사용
    if (pendingHref && !tabActive(pathname, pendingHref)) {
      return href === pendingHref;
    }
    return tabActive(pathname, href);
  }

  const proposeOn = isOn('/propose');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[#dbdbdb] bg-white safe-bottom">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-1.5">
        {LEFT.map(({ id, label, href, Icon, filledWhenActive }) => {
          const on = isOn(href);
          return (
            <Link
              key={id}
              href={href}
              onClick={() => setPendingHref(href)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2"
            >
              <BottomNavIcon icon={Icon} active={on} filledWhenActive={filledWhenActive} />
              <span className={tabLabelClass(on)}>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/propose"
          onClick={() => setPendingHref('/propose')}
          className="relative -top-2 flex min-w-[56px] flex-col items-center gap-1"
        >
          <span
            className={[
              'flex h-11 w-11 items-center justify-center rounded-full',
              proposeOn ? 'bg-[#1a1e22] text-white' : 'bg-transparent text-[#8e8e8e]',
            ].join(' ')}
          >
            <Handshake size={26} strokeWidth={proposeOn ? 2.25 : 1.75} aria-hidden />
          </span>
          {proposeBadge != null && proposeBadge > 0 && (
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3040] px-1 text-[9px] font-bold text-white">
              {proposeBadge}
            </span>
          )}
          <span className={tabLabelClass(proposeOn)}>제안</span>
        </Link>

        {RIGHT.map(({ id, label, href, Icon, filledWhenActive }) => {
          const on = isOn(href);
          return (
            <Link
              key={id}
              href={href}
              onClick={() => setPendingHref(href)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2"
            >
              <BottomNavIcon icon={Icon} active={on} filledWhenActive={filledWhenActive} />
              <span className={tabLabelClass(on)}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
