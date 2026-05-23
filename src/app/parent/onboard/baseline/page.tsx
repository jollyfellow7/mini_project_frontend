import { CaptureBackLink } from '@/components/chungsora/CaptureBackLink';
import { CaptureCoachBody } from '@/components/chungsora/CaptureCoachBody';

export default function ParentBaselinePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-5 py-4">
        <CaptureBackLink href="/parent/pair" className="text-xs font-semibold text-[#00b8cf]">
          ← 뒤로
        </CaptureBackLink>
        <h1 className="mt-2 text-xl font-bold text-[#2f3438]">baseline 촬영</h1>
        <p className="mt-1 text-sm text-[#828c94]">
          입구·바닥·책상 3곳 · 슬롯당 사진 1장 → Gemini AI 품질 평가
        </p>
      </div>
      <CaptureCoachBody mode="baseline" nextHref="/parent/onboard/schedule" />
    </div>
  );
}
