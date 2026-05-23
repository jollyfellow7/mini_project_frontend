'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthLoading } from '@/components/chungsora/AuthLoading';
import { resolveParentAuthRedirect } from '@/lib/chungsora/authRoutes';
import { useAuthStore } from '@/lib/chungsora/authStore';
import { useAuthHydrated } from '@/lib/chungsora/useAuthHydrated';
import { useParentSessionHydrate } from '@/lib/chungsora/useParentSessionHydrate';
import { setRole } from '@/lib/chungsora/role';
import { ParentBottomNav } from './ParentBottomNav';
import { useStopCoachOnLeaveCapture } from '@/lib/chungsora/coachSpeechGuard';
import { fetchParentProposals } from '@/lib/chungsora/clientApi';
import { getPendingThread, useProposeStore } from '@/lib/chungsora/proposeStore';

let lastProposalFetch = 0;
const PROPOSALS_COOLDOWN_MS = 30_000;

const NO_NAV_PREFIXES = [
  '/parent/login',
  '/parent/signup',
  '/parent/pair',
  '/parent/onboard',
];

export function ParentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useStopCoachOnLeaveCapture();
  const hydrated = useAuthHydrated();
  useParentSessionHydrate();
  const parentLoggedIn = useAuthStore((s) => s.parentLoggedIn);
  const onboardDone = useAuthStore((s) => s.onboardDone);
  const hideNav = NO_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  const threads = useProposeStore((s) => s.threads);

  useEffect(() => {
    if (!hydrated) return;
    const redirect = resolveParentAuthRedirect(pathname, parentLoggedIn, onboardDone);
    if (redirect) router.replace(redirect);
  }, [hydrated, pathname, parentLoggedIn, onboardDone, router]);

  useEffect(() => {
    setRole('parent');
    const now = Date.now();
    if (now - lastProposalFetch < PROPOSALS_COOLDOWN_MS) return;
    lastProposalFetch = now;
    fetchParentProposals()
      .then((res) => {
        if (res.threads?.length) useProposeStore.setState({ threads: res.threads });
      })
      .catch(() => undefined);
  }, []);

  const pendingCount = getPendingThread(threads) ? 1 : 0;

  if (!hydrated) {
    return <AuthLoading />;
  }

  const blocked = resolveParentAuthRedirect(pathname, parentLoggedIn, onboardDone);
  if (blocked) {
    return <AuthLoading />;
  }

  if (hideNav) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-[#f7f9fa]">{children}</div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#f7f9fa]">
      <main className="flex-1 pb-24">{children}</main>
      <ParentBottomNav proposeBadge={pendingCount} />
    </div>
  );
}
