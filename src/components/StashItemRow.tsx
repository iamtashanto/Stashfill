interface StashItemRowProps {
  label: string;
  value: string;
  onFill: () => void;
  onCopy: () => void;
  fillLabel?: string;
  copyLabel?: string;
  isSelected?: boolean;
}

export function StashItemRow({
  label,
  value,
  onFill,
  onCopy,
  fillLabel = 'Fill',
  copyLabel = 'Copy',
  isSelected = false,
}: StashItemRowProps) {
  if (!value) return null;

  return (
    <div
      class={`group flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
        isSelected
          ? 'bg-brand-50 ring-1 ring-brand-400 dark:bg-brand-950/40 dark:ring-brand-500'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <div class="min-w-0 flex-1 pr-2">
        <div class="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div class="mt-0.5 select-all truncate text-xs font-medium text-slate-800 dark:text-slate-200">
          {value}
        </div>
      </div>

      <div class="flex shrink-0 items-center space-x-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFill();
          }}
          title={fillLabel}
          aria-label={`${fillLabel} ${label}`}
          class="rounded bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900"
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
          class="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {copyLabel}
        </button>
      </div>
    </div>
  );
}
