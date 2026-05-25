'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addPraisePreset, deletePraisePreset, fetchPraisePresets } from '@/lib/chungsora/clientApi';
import { usePraiseStore } from '@/lib/chungsora/praiseStore';
import { deferEffect } from '@/lib/react/deferEffect';

export default function MorePraisePage() {
  const customPraises = usePraiseStore((s) => s.customPraises);
  const setCustomPraises = usePraiseStore((s) => s.setCustomPraises);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPraisePresets();
      setCustomPraises(res.presets ?? []);
    } catch {
      setError('칭찬 목록을 불러오지 못했습니다.');
      setCustomPraises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    deferEffect(() => {
      void load();
    });
  }, [setCustomPraises]);

  const handleRemove = async (phrase: string) => {
    try {
      const res = await deletePraisePreset(phrase);
      setCustomPraises(res.presets ?? []);
    } catch {
      setError('삭제에 실패했습니다.');
    }
  };

  const handleAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    try {
      const res = await addPraisePreset(trimmed);
      setCustomPraises(res.presets ?? []);
    } catch {
      setError('추가에 실패했습니다.');
    }
  };

  return (
    <div className="px-5 py-6">
      <Link href="/parent/more" className="text-xs font-semibold text-[#00b8cf]">← 더보기</Link>
      <h1 className="mt-3 text-xl font-bold text-[#2f3438]">커스텀 칭찬</h1>
      <p className="mt-1 text-sm text-[#828c94]">AI 코치가 칭찬할 때 활용하는 문구를 관리해요</p>

      {error && <p className="mt-3 text-sm text-[#e03131]">{error}</p>}
      {loading && <p className="mt-4 text-sm text-[#828c94]">불러오는 중…</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {customPraises.map((p) => (
          <button key={p} type="button" onClick={() => void handleRemove(p)} className="rounded-full bg-[#e8f8fb] px-3 py-1.5 text-xs font-semibold text-[#00b8cf]">
            {p} ×
          </button>
        ))}
        {!loading && customPraises.length === 0 && (
          <p className="text-xs text-[#828c94]">등록된 칭찬이 없습니다. 아래에서 추가하세요.</p>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="새 칭찬 문구" className="flex-1 rounded-xl border border-[#eaedef] px-4 py-3 text-sm outline-none" />
        <button type="button" onClick={() => void handleAdd()} className="ch-btn-primary px-4 text-sm">추가</button>
      </div>
    </div>
  );
}
