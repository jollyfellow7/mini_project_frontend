'use client';

import { useEffect } from 'react';
import { CaptureCoachBody } from '@/components/chungsora/CaptureCoachBody';
import { useCleaningSessionStore } from '@/lib/chungsora/cleaningSessionStore';

export default function ChildMissionBeforePage() {
  const resetSession = useCleaningSessionStore((s) => s.resetSession);

  // 새 미션 시작 시 이전 세션 데이터 초기화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetSession(); }, []);

  return <CaptureCoachBody mode="dirty" nextHref="/child/mission/quest" missionStep={2} />;
}
