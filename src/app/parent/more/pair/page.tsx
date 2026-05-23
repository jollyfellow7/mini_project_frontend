'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function PairManagePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-white">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft size={24} className="text-[#212529]" />
        </button>
        <h1 className="text-lg font-bold text-[#212529]">자녀 관리</h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-4">
        {/* 연결 코드 발급 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#212529] mb-1">연결 코드 발급</h2>
          <p className="text-sm text-[#6c757d] mb-4">
            새 기기를 연결하거나 연결 코드를 다시 확인할 수 있어요.
          </p>
          <button
            onClick={() => router.push('/parent/pair/code')}
            className="w-full py-3 rounded-xl bg-[#339af0] text-white font-semibold text-sm"
          >
            새 연결 코드 발급
          </button>
        </div>

        {/* 초기 설정으로 돌아가기 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#212529] mb-1">자녀 정보 재설정</h2>
          <p className="text-sm text-[#6c757d] mb-4">
            닉네임·나이를 변경하거나 새 기기에 처음부터 설정하고 싶을 때 사용하세요.
          </p>
          <button
            onClick={() => router.push('/parent/pair')}
            className="w-full py-3 rounded-xl bg-white border border-[#dee2e6] text-[#495057] font-semibold text-sm"
          >
            처음부터 다시 설정
          </button>
        </div>
      </div>
    </div>
  );
}
