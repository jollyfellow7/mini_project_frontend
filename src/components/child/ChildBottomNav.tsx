'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, ClipboardList, Handshake, ShoppingBag, User } from 'lucide-react';
import { setRole } from '@/lib/chungsora/role';
import { BottomNavIcon } from '@/components/chungsora/BottomNavIcon';

const LEFT = [
  { label: '홈', href: '/child/home', Icon: Home, filledWhenActive: true },
  { label: '로그', href: '/log', Icon: ClipboardList },
] as const;

const RIGHT = [
  { label: '포인트 상점', href: '/child/points', Icon: ShoppingBag },
  { label: '나', href: '/child/me', Icon: User, filledWhenActive: true },
] as const;

const ALL_HREFS = [...LEFT.map((t) => t.href), '/propose', ...RIGHT.map((t) => t.href)];

function tabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function tabLabelClass(active: boolean) {
  return `text-[10px] ${active ? 'font-semibold text-[#1a1e22]' : 'font-normal text-[#8e8e8e]'}`;
}

export function ChildBottomNav() {
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

  function handleClick(href: string) {
    setPendingHref(href);
    setRole('child');
  }

  const proposeOn = isOn('/propose');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[#dbdbdb] bg-white pb-2">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-1.5">
        {LEFT.map(({ label, href, Icon, ...rest }) => {
          const filledWhenActive = 'filledWhenActive' in rest ? rest.filledWhenActive : undefined;
          const on = isOn(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleClick(href)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2"
            >
              <BottomNavIcon icon={Icon} active={on} filledWhenActive={filledWhenActive} />
              <span className={tabLabelClass(on)}>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/propose"
          onClick={() => handleClick('/propose')}
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
          <span className={tabLabelClass(proposeOn)}>제안</span>
        </Link>

        {RIGHT.map(({ label, href, Icon, ...rest }) => {
          const filledWhenActive = 'filledWhenActive' in rest ? rest.filledWhenActive : undefined;
          const on = isOn(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleClick(href)}
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
