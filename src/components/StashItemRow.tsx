import { useState } from 'preact/hooks';

interface StashItemRowProps {
  label: string;
  value: string;
  onFill: () => void;
  onCopy: () => void;
  fillLabel?: string;
  copyLabel?: string;
  revealLabel?: string;
  hideLabel?: string;
  maskedLabel?: string;
  sensitive?: boolean;
  useCount?: number;
  usedBadgeText?: string;
  isSelected?: boolean;
}

export function StashItemRow({
  label,
  value,
  onFill,
  onCopy,
  fillLabel = 'Fill',
  copyLabel = 'Copy',
  revealLabel = 'Reveal sensitive value',
  hideLabel = 'Hide sensitive value',
  maskedLabel = '••••••••',
  sensitive = false,
  useCount = 0,
  usedBadgeText,
  isSelected = false,
}: StashItemRowProps) {
  const [revealed, setRevealed] = useState(false);

  if (!value) return null;

  const isMasked = sensitive && !revealed;

  return (
    <div
      role="listitem"
      class={`group flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
        isSelected
          ? 'bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-950/60 dark:ring-brand-400'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <div class="min-w-0 flex-1 pe-2">
        <div class="flex items-center gap-1.5">
          <span class="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {label}
          </span>
          {useCount > 0 && usedBadgeText && (
            <span class="rounded bg-slate-200 px-1 py-0.5 text-[9px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {usedBadgeText}
            </span>
          )}
        </div>
        <div class="mt-0.5 flex items-center gap-1.5">
          {isMasked ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              aria-label={`${revealLabel}: ${label}`}
              class="cursor-pointer rounded px-1 py-0.5 font-mono text-xs font-medium tracking-widest text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {maskedLabel}
            </button>
          ) : (
            <span class="select-all truncate text-xs font-medium text-slate-900 dark:text-slate-100">
              {value}
            </span>
          )}
          {sensitive && (
            <button
              type="button"
              onClick={() => setRevealed((prev) => !prev)}
              aria-label={revealed ? `${hideLabel}: ${label}` : `${revealLabel}: ${label}`}
              aria-pressed={revealed ? 'true' : 'false'}
              title={revealed ? hideLabel : revealLabel}
              class="rounded p-0.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              {revealed ? (
                <svg
                  class="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  class="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFill();
          }}
          title={fillLabel}
          aria-label={`${fillLabel} ${label}`}
          class="rounded bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          {fillLabel}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          title={copyLabel}
          aria-label={`${copyLabel} ${label}`}
          class="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {copyLabel}
        </button>
      </div>
    </div>
  );
}
