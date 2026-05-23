'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { verifyPairCode } from '@/lib/chungsora/clientApi';
import { useAuthStore } from '@/lib/chungsora/authStore';
import { setRole } from '@/lib/chungsora/role';
import { AuthLoading } from '@/components/chungsora/AuthLoading';

function ChildPairInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setChildSession = useAuthStore((s) => s.setChildSession);
  const [code, setCode] = useState(() => {
    const fromUrl = params.get('code');
    return fromUrl ? fromUrl.toUpperCase().slice(0, 6) : '';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    setLoading(true);
    setError('');
    setRole('child');
    try {
      const res = await verifyPairCode(code);
      if (!res.ok) {
        setError(
          res.reason === 'expired'
            ? '코드가 만료됐어요. 부모 앱에서 새 코드를 받아주세요.'
            : res.reason === 'used'
              ? '이미 사용된 코드예요.'
              : '코드를 확인해주세요.',
        );
        setLoading(false);
        return;
      }
      if (res.device_token) {
        setChildSession({ token: res.device_token, deviceId: res.device_id });
      } else {
        useAuthStore.getState().setChildPaired(true);
      }
      router.push('/child/home');
    } catch {
      setError('연결에 실패했습니다. 코드를 확인해 주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-10">
      <h1 className="text-[26px] font-bold text-[#2f3438]">보호자 연결</h1>
      <p className="mt-2 text-sm text-[#828c94]">QR · 링크 · 6자리 코드</p>

      <div className="mt-6 flex h-36 items-center justify-center rounded-2xl border border-dashed border-[#eaedef] bg-white text-sm text-[#adb5bd]">
        QR 스캔 (카메라 앱)
      </div>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        placeholder="6자리 코드"
        className="mt-4 rounded-xl border border-[#eaedef] px-4 py-4 text-center text-xl font-bold tracking-[0.3em] outline-none focus:border-[#00b8cf]"
      />

      {error ? <p className="mt-2 text-center text-xs text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={() => void connect()}
        disabled={loading || code.length < 4}
        className="ch-btn-primary mt-6 py-4 text-[15px] disabled:opacity-50"
      >
        {loading ? '연결 중…' : '연결하기'}
      </button>
    </div>
  );
}

export default function ChildPairPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ChildPairInner />
    </Suspense>
  );
}
