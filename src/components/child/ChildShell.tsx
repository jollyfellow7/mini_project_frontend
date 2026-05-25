'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthLoading } from '@/components/chungsora/AuthLoading';
import { resolveChildAuthRedirect } from '@/lib/chungsora/authRoutes';
import { useAuthStore } from '@/lib/chungsora/authStore';
import { useAuthHydrated } from '@/lib/chungsora/useAuthHydrated';
import { setRole } from '@/lib/chungsora/role';
import { useChildSessionHydrate } from '@/lib/chungsora/useChildSessionHydrate';
import { ChildBottomNav } from './ChildBottomNav';
import { useStopCoachOnLeaveCapture } from '@/lib/chungsora/coachSpeechGuard';
import { useLockState } from '@/lib/chungsora/useLockState';

const FLOW_PREFIXES = [
  '/child/lock',
  '/child/mission',
  '/child/dirty',
  '/child/after',
  '/child/unlock',
  '/child/pair',
  '/child/pair/relink',
  '/child/quest/session',
];

export function ChildShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useStopCoachOnLeaveCapture();
  const hydrated = useAuthHydrated();
  useChildSessionHydrate();
  const childPaired = useAuthStore((s) => s.childPaired);
  const isLocked = useLockState();
  const isFlowPath = FLOW_PREFIXES.some((p) => pathname.startsWith(p));
  const hideNav = isFlowPath || isLocked;

  useEffect(() => {
    if (!hydrated) return;
    const redirect = resolveChildAuthRedirect(pathname, childPaired);
    if (redirect) router.replace(redirect);
  }, [hydrated, pathname, childPaired, router]);

  // 잠금 시간이어도 청소 미션 플로우(/child/mission 등)는 유지 — 홈·로그만 잠금 화면으로
  useEffect(() => {
    if (!hydrated) return;
    if (isLocked && !isFlowPath && !pathname.startsWith('/child/lock')) {
      router.replace('/child/lock');
    }
  }, [hydrated, isLocked, isFlowPath, pathname, router]);

  useEffect(() => {
    setRole('child');
  }, []);

  if (!hydrated) {
    return <AuthLoading />;
  }

  const blocked = resolveChildAuthRedirect(pathname, childPaired);
  if (blocked) {
    return <AuthLoading />;
  }

  if (hideNav) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-[#f7f9fa]">
        {children}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#f7f9fa]">
      <main className="flex-1 pb-20">{children}</main>
      <ChildBottomNav />
    </div>
  );
}
