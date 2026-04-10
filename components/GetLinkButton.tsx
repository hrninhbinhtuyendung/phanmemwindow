'use client';

import { useEffect, useMemo, useState } from 'react';

type GetLinkButtonProps = {
  url?: string | null;
  waitSeconds?: number;
  className?: string;
  label?: string;
  readyLabel?: string;
  disabledLabel?: string;
  onOpen?: () => void;
};

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function GetLinkButton({
  url,
  waitSeconds = 30,
  className,
  label = 'Get link',
  readyLabel = 'Mở link tải',
  disabledLabel = 'Chưa có link',
  onOpen,
}: GetLinkButtonProps) {
  const isMissing = !url || url.trim().length === 0 || url === '#';
  const [remaining, setRemaining] = useState<number>(0);
  const [unlocked, setUnlocked] = useState(false);

  const state = useMemo(() => {
    if (isMissing) return 'missing';
    if (unlocked) return 'unlocked';
    if (remaining > 0) return 'countdown';
    return 'idle';
  }, [isMissing, unlocked, remaining]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((s) => {
        const next = Math.max(0, s - 1);
        if (next === 0) setUnlocked(true);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  const canOpen = state === 'unlocked';

  if (isMissing) {
    return (
      <button
        type="button"
        disabled
        className={className}
        aria-disabled="true"
      >
        {disabledLabel}
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          if (state === 'idle') {
            setUnlocked(false);
            setRemaining(waitSeconds);
          }
        }}
        disabled={state !== 'idle'}
        className={className}
      >
        {state === 'countdown'
          ? `Vui lòng chờ ${formatSeconds(remaining)}...`
          : state === 'unlocked'
            ? 'Đã sẵn sàng'
            : label}
      </button>

      {canOpen && (
        <a
          href={url as string}
          target="_blank"
          rel="noreferrer"
          onClick={() => onOpen?.()}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-bold py-3 px-6 transition-colors text-center ring-1 ring-gray-200"
        >
          {readyLabel}
        </a>
      )}
    </div>
  );
}
