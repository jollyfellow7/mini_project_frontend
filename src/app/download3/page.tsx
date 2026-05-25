'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle, RefreshCw } from 'lucide-react';

export default function Download3Page() {
  const [info, setInfo] = useState<{
    version: string;
    build_number: string;
    built_at: string;
    commit: string;
    apk_size_bytes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/apk/version-child-v2.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setInfo(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const builtAt = info?.built_at ?? '';
  // 캐시 우회용 쿼리 파라미터
  const ts = builtAt ? `?v=${builtAt.replace(/[^0-9]/g, '')}` : `?v=${Date.now()}`;
  const apkUrl = `/apk/child-v2.apk${ts}`;

  const sizeMb = info?.apk_size_bytes
    ? (info.apk_size_bytes / 1024 / 1024).toFixed(1)
    : null;

  const builtAtLabel = builtAt
    ? new Date(builtAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    : '';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9fa] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#eaedef] bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="text-5xl">📱</span>
          <h1 className="text-xl font-bold text-[#2f3438]">청소해라 자녀 앱</h1>
          <span className="rounded-full bg-[#00B8CF] px-3 py-0.5 text-xs font-bold text-white">
            v2 · release 서명
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#828c94]">
            <RefreshCw size={16} className="animate-spin" />
            버전 정보 로딩 중...
          </div>
        ) : info ? (
          <ul className="mb-6 space-y-1 rounded-xl bg-[#f7f9fa] px-4 py-3 text-sm text-[#828c94]">
            <li>버전: <span className="font-semibold text-[#2f3438]">{info.version} (build {info.build_number})</span></li>
            {sizeMb && <li>크기: <span className="font-semibold text-[#2f3438]">{sizeMb} MB</span></li>}
            {builtAtLabel && <li>빌드: <span className="font-semibold text-[#2f3438]">{builtAtLabel}</span></li>}
            <li className="font-mono text-[11px]">{info.commit.slice(0, 7)}</li>
          </ul>
        ) : null}

        <a
          href={apkUrl}
          download="chungsora-child-v2.apk"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00B8CF] py-4 text-[15px] font-bold text-white active:bg-[#009ab0]"
        >
          <Download size={20} />
          APK 다운로드
        </a>

        <div className="mt-5 space-y-2 rounded-xl bg-[#fff8e1] px-4 py-3 text-[12px] text-[#856404]">
          <p className="font-semibold">설치 전 확인</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>기존 청소해라 앱이 있으면 <strong>삭제</strong> 후 설치</li>
            <li>설정 → 보안 → <strong>알 수 없는 앱 설치 허용</strong></li>
            <li>Play 프로텍트 경고 뜨면 <strong>무시하고 설치</strong> 선택</li>
          </ol>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#e8f9fc] px-4 py-3 text-[12px] text-[#006d80]">
          <CheckCircle size={14} className="mt-0.5 shrink-0" />
          <p>이 APK는 고정된 release keystore로 서명되어, 이후 업데이트 시 재설치 없이 덮어쓰기 가능합니다.</p>
        </div>
      </div>
    </div>
  );
}
