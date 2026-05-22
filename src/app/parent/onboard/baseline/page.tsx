import { CaptureBackLink } from '@/components/chungsora/CaptureBackLink';
import { CaptureCoachBody } from '@/components/chungsora/CaptureCoachBody';

type SearchParams = { reshoot?: string };

export default async function ParentBaselinePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const reshoot = sp.reshoot === '1';
  // 재촬영(더보기 진입)이면 완료 후 더보기로 복귀, 최초 온보딩이면 스케줄 설정으로 진행
  const backHref = reshoot ? '/parent/more' : '/parent/pair';
  const nextHref = reshoot ? '/parent/more' : '/parent/onboard/schedule';

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-5 py-4">
        <CaptureBackLink href={backHref} className="text-xs font-semibold text-[#00b8cf]">
          ← 뒤로
        </CaptureBackLink>
        <h1 className="mt-2 text-xl font-bold text-[#2f3438]">
          {reshoot ? '기준 사진 다시 촬영' : 'baseline 촬영'}
        </h1>
        <p className="mt-1 text-sm text-[#828c94]">
          입구·바닥·책상 3곳 · 슬롯당 사진 1장 → Gemini AI 품질 평가
        </p>
        {reshoot && (
          <p className="mt-1 text-xs text-[#adb5bd]">
            다시 촬영하면 기존 기준 사진을 새 사진으로 덮어써요.
          </p>
        )}
      </div>
      <CaptureCoachBody mode="baseline" nextHref={nextHref} />
    </div>
  );
}
