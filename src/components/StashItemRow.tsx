import { useState, useRef } from 'preact/hooks';

interface StashItemRowProps {
  label: string;
  value: string;
  keyName?: string;
  category?: string;
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

function getFieldIcon(keyName?: string, label?: string, sensitive?: boolean) {
  const norm = `${keyName || ''} ${label || ''}`.toLowerCase();
  if (sensitive || norm.includes('tax') || norm.includes('ssn') || norm.includes('nid')) {
    return (
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
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    );
  }
  if (norm.includes('email') || norm.includes('mail')) {
    return (
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
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  }
  if (norm.includes('phone') || norm.includes('tel') || norm.includes('mobile')) {
    return (
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
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    );
  }
  if (
    norm.includes('address') ||
    norm.includes('city') ||
    norm.includes('zip') ||
    norm.includes('state')
  ) {
    return (
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
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    );
  }
  if (
    norm.includes('url') ||
    norm.includes('link') ||
    norm.includes('web') ||
    norm.includes('site')
  ) {
    return (
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
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    );
  }
  // Default: Person / user icon
  return (
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function StashItemRow({
  label,
  value,
  keyName,
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
  const [recentlyFilled, setRecentlyFilled] = useState(false);
  const [recentlyCopied, setRecentlyCopied] = useState(false);
  const fillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!value) return null;

  const isMasked = sensitive && !revealed;

  const handleFillClick = () => {
    if (fillTimer.current) clearTimeout(fillTimer.current);
    setRecentlyFilled(true);
    fillTimer.current = setTimeout(() => setRecentlyFilled(false), 1200);
    onFill();
  };

  const handleCopyClick = () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setRecentlyCopied(true);
    copyTimer.current = setTimeout(() => setRecentlyCopied(false), 1200);
    onCopy();
  };

  return (
    <div
      role="listitem"
      class={`group relative flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 transition-all duration-150 ${
        isSelected
          ? 'border-brand-500/60 bg-brand-50/70 shadow-sm ring-1 ring-brand-500/50 dark:border-brand-500/40 dark:bg-brand-950/40 dark:ring-brand-500/30'
          : 'hover:border-slate-200/80 hover:bg-slate-50/90 dark:hover:border-slate-800 dark:hover:bg-slate-800/50'
      }`}
    >
      <div class="flex min-w-0 flex-1 items-center gap-2.5 pe-2">
        <div
          class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
            sensitive
              ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-brand-950/50 dark:group-hover:text-brand-300'
          }`}
          aria-hidden="true"
        >
          {getFieldIcon(keyName, label, sensitive)}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </span>
            {useCount > 0 && usedBadgeText && (
              <span class="py-0.2 inline-flex items-center rounded-full bg-slate-100 px-1.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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
                class="cursor-pointer rounded font-mono text-xs font-semibold tracking-widest text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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
                class="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100"
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
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFillClick();
          }}
          title={fillLabel}
          aria-label={`${fillLabel} ${label}`}
          class={`shadow-xs flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 ${
            recentlyFilled
              ? 'bg-emerald-600 text-white'
              : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-400'
          }`}
        >
          {recentlyFilled ? (
            <>
              <svg
                class="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{fillLabel}</span>
            </>
          ) : (
            <>
              <svg
                class="h-3 w-3 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{fillLabel}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyClick();
          }}
          title={copyLabel}
          aria-label={`${copyLabel} ${label}`}
          class={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all duration-150 ${
            recentlyCopied
              ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {recentlyCopied ? (
            <>
              <svg
                class="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{copyLabel}</span>
            </>
          ) : (
            <>
              <svg
                class="h-3 w-3 opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{copyLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
