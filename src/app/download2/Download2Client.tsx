'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Download,
  Shield,
  Smartphone,
  Sparkles,
  Lock,
  Camera,
  Users,
  Baby,
  ExternalLink,
  Info,
} from 'lucide-react';
import { DownloadQrPanel } from '@/components/download/DownloadQrPanel';
import {
  formatApkSize,
  formatBuiltAt,
  shortCommit,
  type ApkVersion,
} from '@/lib/download/apkMeta';
import { deferEffect } from '@/lib/react/deferEffect';

type Tab = 'parent' | 'child';

const PARENT_FEATURES = [
  { icon: Users, title: '청소 관리', desc: '자녀 현황 · 포인트 지급' },
  { icon: Lock, title: '스케줄 설정', desc: '잠금 시간 · 구역 설정' },
  { icon: Sparkles, title: 'AI 리포트', desc: '청소 이력 · 베이스라인' },
] as const;

const CHILD_FEATURES = [
  { icon: Lock, title: '기기 잠금 (DPC)', desc: '17:00 자동 · Lock Task' },
  { icon: Camera, title: 'AI 청소 검증', desc: 'baseline 비교 · 합격 시 해제' },
  { icon: Sparkles, title: '포인트 적립', desc: '스트릭 배율 · P 상점' },
] as const;

export function Download2Client() {
  const [tab, setTab] = useState<Tab>('parent');
  const [childInfo, setChildInfo] = useState<ApkVersion | null>(null);

  // APK 준비 상태
  const [parentV2ApkReady, setParentV2ApkReady] = useState(false);
  const [parentV2ApkSizeBytes, setParentV2ApkSizeBytes] = useState<number | null>(null);

  const [childV2ApkReady, setChildV2ApkReady] = useState(false);
  const [childV2ApkSizeBytes, setChildV2ApkSizeBytes] = useState<number | null>(null);

  const [childV1ApkReady, setChildV1ApkReady] = useState(false);
  const [childV1ApkSizeBytes, setChildV1ApkSizeBytes] = useState<number | null>(null);

  const [origin, setOrigin] = useState('');

  useEffect(() => {
    deferEffect(() => setOrigin(window.location.origin));

    // 자녀 Flutter APK 메타
    fetch('/apk/version.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setChildInfo)
      .catch(() => undefined);

    // 부모 APKv2
    fetch('/apk/parent-pwa-v2.apk', { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        setParentV2ApkReady(r.ok);
        const len = r.headers.get('content-length');
        if (len) setParentV2ApkSizeBytes(parseInt(len, 10));
      })
      .catch(() => setParentV2ApkReady(false));

    // 자녀 APKv2
    fetch('/apk/child-v2.apk', { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        setChildV2ApkReady(r.ok);
        const len = r.headers.get('content-length');
        if (len) setChildV2ApkSizeBytes(parseInt(len, 10));
      })
      .catch(() => setChildV2ApkReady(false));

    // 자녀 APKv1 (기존 Flutter)
    fetch('/apk/app-release.apk', { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        setChildV1ApkReady(r.ok);
        const len = r.headers.get('content-length');
        if (len) setChildV1ApkSizeBytes(parseInt(len, 10));
      })
      .catch(() => setChildV1ApkReady(false));
  }, []);

  const parentV2SizeLabel = useMemo(
    () => formatApkSize(parentV2ApkSizeBytes),
    [parentV2ApkSizeBytes],
  );

  const childV2SizeLabel = useMemo(
    () => formatApkSize(childV2ApkSizeBytes),
    [childV2ApkSizeBytes],
  );

  const childV1SizeLabel = useMemo(
    () => formatApkSize(childInfo?.apk_size_bytes) ?? formatApkSize(childV1ApkSizeBytes),
    [childInfo?.apk_size_bytes, childV1ApkSizeBytes],
  );

  const childPageUrl = origin ? `${origin}/download2` : '/download2';
  const parentPageUrl = origin ? `${origin}/download2` : '/download2';

  const childV1ApkUrl = origin ? `${origin}/apk/app-release.apk` : '/apk/app-release.apk';
  const childV2ApkUrl = origin ? `${origin}/apk/child-v2.apk` : '/apk/child-v2.apk';
  const parentV2ApkUrl = origin ? `${origin}/apk/parent-pwa-v2.apk` : '/apk/parent-pwa-v2.apk';

  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col">
        {/* 헤더 */}
        <header className="border-b border-[#eaedef] bg-white px-4 pb-6 pt-10">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-[#828c94] hover:text-[#2f3438]"
          >
            <ChevronLeft size={18} />
            홈
          </Link>
          <p className="text-[13px] font-semibold tracking-wide text-[#00B8CF]">CHUNGSORA</p>
          <h1 className="mt-1 text-[26px] font-bold text-[#2f3438]">청소해라 · 앱 다운로드</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#828c94]">
            부모 / 자녀 앱을 각각 설치해 주세요.
          </p>

          {/* 탭 */}
          <div className="mt-5 flex rounded-xl bg-[#f0f4f6] p-1">
            <button
              type="button"
              onClick={() => setTab('parent')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                tab === 'parent'
                  ? 'bg-white text-[#00B8CF] shadow-sm'
                  : 'text-[#828c94] hover:text-[#2f3438]'
              }`}
            >
              <Users size={15} />
              부모용
            </button>
            <button
              type="button"
              onClick={() => setTab('child')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                tab === 'child'
                  ? 'bg-white text-[#00B8CF] shadow-sm'
                  : 'text-[#828c94] hover:text-[#2f3438]'
              }`}
            >
              <Baby size={15} />
              자녀용
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-4 px-4 py-6">
          {/* ─── 부모 탭 ─── */}
          {tab === 'parent' && (
            <>
              {/* 기능 */}
              <section className="grid grid-cols-3 gap-2">
                {PARENT_FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[#eaedef] bg-white p-3 text-center"
                  >
                    <Icon size={20} className="mx-auto text-[#00B8CF]" />
                    <p className="mt-2 text-[11px] font-bold text-[#2f3438]">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#adb5bd]">{desc}</p>
                  </div>
                ))}
              </section>

              {/* PWA 안내 */}
              <section className="flex items-start gap-3 rounded-2xl border border-[#d0f0f5] bg-[#e8f9fc] p-4">
                <Info size={16} className="mt-0.5 shrink-0 text-[#00B8CF]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#0090a8]">PWA 기반 앱 (v2)</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#006d80]">
                    부모 앱은 PWA(웹앱)를 Android 패키지로 변환한 v2 버전입니다.
                    웹 브라우저 없이 앱처럼 실행됩니다.
                  </p>
                </div>
              </section>

              {/* APK 카드 - v2 */}
              <section className="ch-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[rgba(0,184,207,0.12)] text-3xl">
                    👨‍👩‍👧
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#2f3438]">청소해라 (부모)</p>
                      <span className="rounded-full bg-[#00B8CF] px-2 py-0.5 text-[10px] font-bold text-white">
                        APKv2
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#828c94]">
                      PWA · Android
                      {parentV2SizeLabel ? ` · ${parentV2SizeLabel}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[#adb5bd]">
                      자녀 현황 관리 · 스케줄 설정 · AI 리포트
                    </p>
                  </div>
                </div>

                {parentV2ApkReady ? (
                  <a
                    href="/apk/parent-pwa-v2.apk"
                    download="chungsora-parent-v2.apk"
                    className="ch-btn-primary mt-5 flex w-full items-center justify-center gap-2 py-4 text-[15px] font-semibold"
                  >
                    <Download size={20} />
                    부모 APKv2 다운로드
                  </a>
                ) : (
                  <div className="mt-5 rounded-xl bg-[#f7f9fa] px-4 py-4 text-center text-sm text-[#828c94]">
                    부모 APKv2 준비 중입니다.
                    <br />
                    <span className="mt-1 block text-xs">
                      잠시 후 다시 확인하거나, 아래 웹 버전으로 이용해 주세요.
                    </span>
                    <a
                      href="/main"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#00B8CF] underline-offset-2 hover:underline"
                    >
                      웹 버전 바로가기
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </section>

              {/* QR */}
              {origin && (
                <DownloadQrPanel
                  pageUrl={parentPageUrl}
                  apkUrl={parentV2ApkReady ? parentV2ApkUrl : null}
                  apkReady={parentV2ApkReady}
                />
              )}

              {/* 설치 방법 */}
              <section className="ch-card p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[#2f3438]">
                  <Smartphone size={18} className="text-[#00B8CF]" />
                  설치 방법
                </h2>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#828c94]">
                  <li>APK 다운로드 또는 QR 스캔</li>
                  <li>「알 수 없는 앱」 설치 허용</li>
                  <li>회원가입 후 자녀 앱과 페어링</li>
                </ol>
              </section>
            </>
          )}

          {/* ─── 자녀 탭 ─── */}
          {tab === 'child' && (
            <>
              {/* 기능 */}
              <section className="grid grid-cols-3 gap-2">
                {CHILD_FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[#eaedef] bg-white p-3 text-center"
                  >
                    <Icon size={20} className="mx-auto text-[#00B8CF]" />
                    <p className="mt-2 text-[11px] font-bold text-[#2f3438]">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#adb5bd]">{desc}</p>
                  </div>
                ))}
              </section>

              {/* ── 자녀 APKv2 섹션 ── */}
              <section className="flex items-start gap-3 rounded-2xl border border-[#d0f0f5] bg-[#e8f9fc] p-4">
                <Info size={16} className="mt-0.5 shrink-0 text-[#00B8CF]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#0090a8]">WebView + FCM 잠금 · 웹 UI 사용</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#006d80]">
                    v2는 WebView 기반으로 웹 UI를 그대로 사용하며 FCM으로 잠금을 제어합니다.
                  </p>
                </div>
              </section>

              <section className="ch-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[rgba(0,184,207,0.10)] text-3xl">
                    📱
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#2f3438]">청소해라 (자녀)</p>
                      <span className="rounded-full bg-[#00B8CF] px-2 py-0.5 text-[10px] font-bold text-white">
                        신규 v2
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#828c94]">
                      WebView + FCM
                      {childV2SizeLabel ? ` · ${childV2SizeLabel}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[#adb5bd]">WebView + FCM 잠금 · 웹 UI 사용</p>
                  </div>
                </div>

                {childV2ApkReady ? (
                  <a
                    href="/apk/child-v2.apk"
                    download="chungsora-child-v2.apk"
                    className="ch-btn-primary mt-5 flex w-full items-center justify-center gap-2 py-4 text-[15px] font-semibold"
                  >
                    <Download size={20} />
                    자녀 APKv2 다운로드
                  </a>
                ) : (
                  <div className="mt-5 rounded-xl bg-[#f7f9fa] px-4 py-4 text-center text-sm text-[#828c94]">
                    자녀 APKv2 준비 중입니다.
                  </div>
                )}
              </section>

              {/* ── 자녀 APKv1 섹션 ── */}
              <section className="flex items-start gap-3 rounded-2xl border border-[#ffd6d9] bg-[#fff0f1] p-4">
                <Shield size={16} className="mt-0.5 shrink-0 text-[#f04452]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#c0202e]">Flutter 네이티브 · 잠금 전용</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#8b1a24]">
                    기기 잠금(DPC)은 Android 네이티브 API가 필요합니다.
                    반드시 아래 Flutter APK를 설치해야 잠금 기능이 작동합니다.
                  </p>
                </div>
              </section>

              <section className="ch-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[rgba(240,68,82,0.10)] text-3xl">
                    📱
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#2f3438]">청소해라 (자녀)</p>
                      <span className="rounded-full bg-[#828c94] px-2 py-0.5 text-[10px] font-bold text-white">
                        기존
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#828c94]">
                      v{childInfo?.version ?? '0.5.0'}
                      {childInfo?.build_number ? ` · build ${childInfo.build_number}` : ''}
                      {childV1SizeLabel ? ` · ${childV1SizeLabel}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[#adb5bd]">{formatBuiltAt(childInfo?.built_at)}</p>
                    {shortCommit(childInfo?.commit) && (
                      <p className="mt-0.5 font-mono text-[10px] text-[#c2c8cc]">
                        commit {shortCommit(childInfo?.commit)}
                      </p>
                    )}
                    {childInfo?.package && (
                      <p className="mt-0.5 font-mono text-[10px] text-[#c2c8cc]">{childInfo.package}</p>
                    )}
                    <p className="mt-1 text-xs text-[#adb5bd]">Flutter 네이티브 · 잠금 전용</p>
                  </div>
                </div>

                {childV1ApkReady ? (
                  <a
                    href="/apk/app-release.apk"
                    download="chungsora-child-v1.apk"
                    className="ch-btn-primary mt-5 flex w-full items-center justify-center gap-2 py-4 text-[15px] font-semibold"
                  >
                    <Download size={20} />
                    자녀 APKv1 다운로드
                  </a>
                ) : (
                  <div className="mt-5 rounded-xl bg-[#f7f9fa] px-4 py-4 text-center text-sm text-[#828c94]">
                    APK 파일이 아직 없습니다.
                    <br />
                    GitHub Actions <code className="text-xs">build-apk</code> 실행 후 다시 확인해 주세요.
                  </div>
                )}
              </section>

              {/* QR */}
              {origin && (
                <DownloadQrPanel
                  pageUrl={childPageUrl}
                  apkUrl={childV1ApkReady ? childV1ApkUrl : childV2ApkReady ? childV2ApkUrl : null}
                  apkReady={childV1ApkReady || childV2ApkReady}
                />
              )}

              {/* 설치 방법 */}
              <section className="ch-card p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[#2f3438]">
                  <Smartphone size={18} className="text-[#00B8CF]" />
                  설치 방법
                </h2>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#828c94]">
                  <li>APK 다운로드 또는 QR 스캔</li>
                  <li>「알 수 없는 앱」 설치 허용</li>
                  <li>부모 PWA에서 페어링 코드 → 자녀 앱 입력</li>
                  <li>
                    Device Owner 등록 (잠금 필수) —{' '}
                    <Link
                      href="/download/device-owner"
                      className="inline-flex items-center gap-0.5 font-medium text-[#00B8CF] underline-offset-2 hover:underline"
                    >
                      설정 가이드
                      <ExternalLink size={12} />
                    </Link>
                  </li>
                </ol>
              </section>

              <section className="ch-card p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[#2f3438]">
                  <Shield size={18} className="text-[#f04452]" />
                  잠금 → 청소 → 해제
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-[#828c94]">
                  <li>· 부모 설정 시간(예: 17:00) 자동 잠금</li>
                  <li>· 유튜브·게임·카톡 차단 · 전화 허용 가능</li>
                  <li>· 3곳 촬영 + AI baseline 비교</li>
                  <li>· pass_score 합격 → OS 잠금 해제 + P 적립</li>
                </ul>
              </section>
            </>
          )}
        </div>

        <footer className="mt-auto px-4 pb-8 text-center text-xs text-[#adb5bd]">
          청소해라 · Android ·{' '}
          <Link href="/download" className="underline-offset-2 hover:underline">
            기존 다운로드 페이지
          </Link>
          {' · '}
          <Link href="/download/device-owner" className="underline-offset-2 hover:underline">
            Device Owner
          </Link>
        </footer>
      </main>
    </div>
  );
}
