const PARENT_PUBLIC = ['/parent/login', '/parent/signup'] as const;
const PARENT_ONBOARDING = ['/parent/pair', '/parent/onboard'] as const;
const CHILD_PUBLIC = ['/child/pair'] as const;
/** 이미 연결된 자녀도 접근 가능 — 새 폰 교체용 */
const CHILD_PAIR_RELINK = '/child/pair/relink';

function isParentPairSetupPath(pathname: string) {
  return pathname === '/parent/pair' || pathname.startsWith('/parent/pair/code');
}

function startsWithAny(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((p) => pathname.startsWith(p));
}

export function getParentHomePath(onboardDone: boolean) {
  return onboardDone ? '/parent/home' : '/parent/pair';
}

export function getChildHomePath() {
  return '/child/home';
}

export function resolveParentAuthRedirect(
  pathname: string,
  parentLoggedIn: boolean,
  onboardDone: boolean,
): string | null {
  const isPublic = startsWithAny(pathname, PARENT_PUBLIC);
  const isOnboarding = startsWithAny(pathname, PARENT_ONBOARDING);

  if (parentLoggedIn && isPublic) {
    return getParentHomePath(onboardDone);
  }

  if (parentLoggedIn && onboardDone && isParentPairSetupPath(pathname)) {
    return getParentHomePath(true);
  }

  if (!parentLoggedIn) {
    return isPublic ? null : '/parent/login';
  }

  if (!onboardDone && !isOnboarding) {
    return '/parent/pair';
  }

  return null;
}

export function resolveChildAuthRedirect(pathname: string, childPaired: boolean): string | null {
  const isPublic = startsWithAny(pathname, CHILD_PUBLIC);

  if (
    childPaired &&
    pathname.startsWith('/child/pair') &&
    !pathname.startsWith(CHILD_PAIR_RELINK)
  ) {
    return getChildHomePath();
  }

  if (!childPaired && !isPublic) {
    return '/child/pair';
  }

  return null;
}
