'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoleShell } from '@/components/chungsora/RoleShell';
import { CleaningLogView } from '@/components/chungsora/CleaningLogView';
import { CleaningCalendar } from '@/components/chungsora/CleaningCalendar';
import { useChungsoraRole } from '@/lib/chungsora/useChungsoraRole';

function LogViewBody({ dateParam }: { dateParam: string | null }) {
  const role = useChungsoraRole();
  if (role === null) return null;
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {role === 'parent' && <CleaningCalendar role={role} />}
      <CleaningLogView role={role} showBack={role === 'child'} dateParam={dateParam} />
    </div>
  );
}

function LogPageInner() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  return (
    <RoleShell childHideNav>
      <LogViewBody dateParam={dateParam} />
    </RoleShell>
  );
}

export default function LogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center text-sm text-[#828c94]">
          로그 불러오는 중…
        </div>
      }
    >
      <LogPageInner />
    </Suspense>
  );
}
