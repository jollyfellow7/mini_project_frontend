'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PassScoreControl } from '@/components/chungsora/PassScoreControl';
import { fetchLockPolicy, updateLockPolicy } from '@/lib/chungsora/clientApi';
import { useSettingsStore } from '@/lib/chungsora/settingsStore';

type AllowedNumber = { name: string; number: string };

const EMERGENCY_NUMBERS: AllowedNumber[] = [
  { name: '119 (소방·구급)', number: '119' },
  { name: '112 (경찰)', number: '112' },
  { name: '120 (다산콜)', number: '120' },
];

function normalizeNumbers(value: unknown): AllowedNumber[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (!v || typeof v !== 'object') return null;
      const rec = v as Record<string, unknown>;
      const name = typeof rec.name === 'string' ? rec.name.trim() : '';
      const number = typeof rec.number === 'string' ? rec.number.trim() : '';
      if (!name || !number) return null;
      return { name, number };
    })
    .filter((v): v is AllowedNumber => !!v);
}

export default function MoreLockPage() {
  const passScore = useSettingsStore((s) => s.passScore);
  const setPassScore = useSettingsStore((s) => s.setPassScore);
  const [numbers, setNumbers] = useState<AllowedNumber[]>([]);
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchLockPolicy()
      .then((p) => {
        setPassScore(p.pass_score);
        setNumbers(normalizeNumbers(p.allowed_numbers));
      })
      .catch(() => undefined);
  }, [setPassScore]);

  const persistNumbers = async (next: AllowedNumber[]) => {
    setNumbers(next);
    await updateLockPolicy({ allowed_numbers: next });
  };

  const addNumber = () => {
    if (numbers.length >= 3) {
      window.alert('지정 번호는 최대 3개까지 등록할 수 있어요.');
      return;
    }
    const name = formName.trim();
    const number = formNumber.trim();
    if (!name || !number) return;
    setFormName('');
    setFormNumber('');
    void persistNumbers([...numbers, { name, number }]).catch(() => undefined);
  };

  const removeNumber = (index: number) => {
    void persistNumbers(numbers.filter((_, i) => i !== index)).catch(() => undefined);
  };

  const savePassScore = async (value: number) => {
    setPassScore(value);
    setSaving(true);
    try {
      await updateLockPolicy({ pass_score: value, allowed_numbers: numbers });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-6">
      <Link href="/parent/more" className="text-xs font-semibold text-[#00b8cf]">
        ← 더보기
      </Link>
      <h1 className="mt-3 text-xl font-bold text-[#2f3438]">잠금 설정</h1>

      <div className="ch-card mt-6 p-5">
        <PassScoreControl value={passScore} onChange={(v) => void savePassScore(v)} />
      </div>

      <div className="ch-card mt-4 p-5">
        <p className="text-sm font-bold text-[#2f3438]">잠금 중 허용 전화번호</p>

        <p className="mt-3 text-xs text-[#828c94]">긴급번호 (고정)</p>
        <ul className="mt-2 space-y-1.5">
          {EMERGENCY_NUMBERS.map((n) => (
            <li key={n.number} className="rounded-lg bg-[#f7f9fa] px-3 py-2 text-sm">
              {n.name}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-[#828c94]">지정번호 (최대 3개)</p>
        <ul className="mt-2 space-y-1.5">
          {numbers.map((n, i) => (
            <li key={`${n.number}-${i}`} className="flex items-center justify-between rounded-lg bg-[#f7f9fa] px-3 py-2 text-sm">
              <span>
                {n.name} · {n.number}
              </span>
              <button type="button" onClick={() => removeNumber(i)} className="text-[#828c94]">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>

        {numbers.length < 3 ? (
          <div className="mt-3 flex gap-2">
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="이름 (예: 엄마)"
              className="flex-1 rounded-lg border border-[#eaedef] px-3 py-2 text-sm"
            />
            <input
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
              placeholder="010-1234-5678"
              className="flex-1 rounded-lg border border-[#eaedef] px-3 py-2 text-sm"
            />
            <button type="button" onClick={addNumber} className="rounded-lg bg-[#00b8cf] px-3 text-white">
              <Plus size={18} />
            </button>
          </div>
        ) : null}
      </div>

      {saving ? <p className="mt-2 text-center text-xs text-[#828c94]">저장 중...</p> : null}
    </div>
  );
}
