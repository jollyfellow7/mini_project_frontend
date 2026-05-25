'use client';

type LogPhotoPairProps = {
  beforeUrl: string | null;
  afterUrl: string | null;
};

function PhotoSlot({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-xl border border-[#eaedef] bg-white/60">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <p className="text-xs font-semibold text-[#828c94]">{label}</p>
          <p className="text-[11px] text-[#b0b8be]">사진 없음</p>
        </div>
      )}
      {url && (
        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {label}
        </span>
      )}
    </div>
  );
}

export function LogPhotoPair({ beforeUrl, afterUrl }: LogPhotoPairProps) {
  return (
    <div className="mb-4 flex gap-2">
      <PhotoSlot label="Before" url={beforeUrl} />
      <PhotoSlot label="After" url={afterUrl} />
    </div>
  );
}
