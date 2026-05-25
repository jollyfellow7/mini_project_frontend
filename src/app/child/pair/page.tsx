'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPairCode } from '@/lib/chungsora/clientApi';
import { useAuthStore } from '@/lib/chungsora/authStore';
import { setRole } from '@/lib/chungsora/role';
import { AuthLoading } from '@/components/chungsora/AuthLoading';

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

function parseCodeFromRaw(raw: string): string | null {
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('code');
    if (fromQuery) return fromQuery.toUpperCase().slice(0, 6);
  } catch {
    // ignore
  }
  if (/^[A-Z0-9]{4,8}$/i.test(raw)) return raw.toUpperCase().slice(0, 6);
  return null;
}

function ChildPairInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setChildSession = useAuthStore((s) => s.setChildSession);
  const [code, setCode] = useState(() => {
    const fromUrl = params.get('code');
    return fromUrl ? fromUrl.toUpperCase().slice(0, 6) : '';
  });
  const [error, setError] = useState('');
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    const start = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setScanError('카메라를 지원하지 않아 코드 입력만 사용할 수 있어요.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        setScanError('카메라 권한이 필요해요. 아래에서 코드를 직접 입력해 주세요.');
        return;
      }

      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      if (!Detector) {
        setScanError('이 브라우저에서는 QR 자동 인식이 제한돼요. 코드를 직접 입력해 주세요.');
        return;
      }
      const detector = new Detector({ formats: ['qr_code'] });

      const loop = async () => {
        if (!active || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          const raw = found?.[0]?.rawValue;
          if (raw) {
            const parsed = parseCodeFromRaw(raw);
            if (parsed) {
              setCode(parsed);
              active = false;
              return;
            }
          }
        } catch {
          // ignore transient detector errors
        }
        scanTimerRef.current = window.setTimeout(loop, 300);
      };
      void loop();
    };

    void start();
    return () => {
      active = false;
      if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const connect = async () => {
    setLoading(true);
    setError('');
    setRole('child');
    try {
      const res = await verifyPairCode(code);
      if (!res.ok) {
        setError(
          res.reason === 'expired'
            ? '코드가 만료됐어요. 부모앱에서 새 코드를 받아 주세요.'
            : res.reason === 'used'
              ? '이미 사용된 코드예요.'
              : '코드를 확인해 주세요.',
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
      setError('연결에 실패했습니다. 코드를 다시 확인해 주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-10">
      <h1 className="text-[26px] font-bold text-[#2f3438]">보호자 연결</h1>
      <p className="mt-2 text-sm text-[#828c94]">QR 또는 6자리 코드를 입력하세요.</p>

      <div className="relative mt-6 aspect-square overflow-hidden rounded-2xl border border-[#eaedef] bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {scanError ? (
          <p className="absolute inset-0 flex items-center justify-center bg-black/70 px-4 text-center text-sm text-white/85">
            {scanError}
          </p>
        ) : null}
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
        {loading ? '연결 중...' : '연결하기'}
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
