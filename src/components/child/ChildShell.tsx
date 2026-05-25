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

  useEffect(() => {
    if (!hydrated) return;
    if (isLocked && !pathname.startsWith('/child/lock')) {
      router.replace('/child/lock');
    }
  }, [hydrated, isLocked, pathname, router]);

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
      <main className="flex-1 pb-24">{children}</main>
      <ChildBottomNav />
    </div>
  );
}
