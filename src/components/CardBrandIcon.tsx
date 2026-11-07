import type { CardBrand } from '../core/luhn';

export function CardBrandIcon({
  brand,
  className = '',
}: {
  brand: CardBrand | string;
  className?: string;
}) {
  const normalized = brand.toLowerCase();

  const badgeColors: Record<string, string> = {
    visa: 'bg-blue-700 text-white',
    mastercard: 'bg-amber-700 text-white',
    amex: 'bg-sky-700 text-white',
    discover: 'bg-orange-700 text-white',
    jcb: 'bg-emerald-700 text-white',
    diners: 'bg-indigo-700 text-white',
    unionpay: 'bg-teal-700 text-white',
    other: 'bg-slate-700 text-white dark:bg-slate-600',
  };

  const colorClass = badgeColors[normalized] ?? badgeColors.other;

  return (
    <span
      class={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass} ${className}`}
      aria-label={brand}
    >
      <svg
        class="h-3 w-3 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
      <span>{normalized}</span>
    </span>
  );
}
