export interface StashfillLogoProps {
  size?: number;
  class?: string;
  hasGlow?: boolean;
}

export function StashfillLogo({ size = 32, class: className = '', hasGlow = false }: StashfillLogoProps) {
  const s = size;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={s}
      height={s}
      class={`shrink-0 select-none ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="stashfill-bg-grad" x1="12" y1="12" x2="116" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="55%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#7c3aed" />
        </linearGradient>

        <linearGradient id="stashfill-card-grad" x1="34" y1="46" x2="94" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
          <stop offset="100%" stop-color="#eef2ff" stop-opacity="0.92" />
        </linearGradient>

        <linearGradient id="stashfill-bolt-grad" x1="62" y1="52" x2="80" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#6d28d9" />
        </linearGradient>

        {hasGlow && (
          <filter id="stashfill-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#4f46e5" flood-opacity="0.35" />
          </filter>
        )}
      </defs>

      {/* Outer Squircle Container */}
      <rect
        x="12"
        y="12"
        width="104"
        height="104"
        rx="28"
        fill="url(#stashfill-bg-grad)"
        filter={hasGlow ? 'url(#stashfill-glow)' : undefined}
      />

      {/* Subtle Inner Bevel Highlight */}
      <rect
        x="13.5"
        y="13.5"
        width="101"
        height="101"
        rx="26.5"
        stroke="#ffffff"
        stroke-opacity="0.22"
        stroke-width="1.5"
        fill="none"
      />

      {/* Layer 1: Back Card (Stash Stack) */}
      <rect x="36" y="38" width="56" height="32" rx="7" fill="#ffffff" fill-opacity="0.25" />

      {/* Layer 2: Mid Card (Stash Stack) */}
      <rect x="36" y="44" width="56" height="34" rx="7" fill="#ffffff" fill-opacity="0.45" />

      {/* Layer 3: Main Front Vault Card */}
      <rect x="36" y="50" width="56" height="42" rx="8" fill="url(#stashfill-card-grad)" />

      {/* Security Chip Icon (Gold-Indigo Microchip Accent) */}
      <rect x="43" y="58" width="13" height="11" rx="2.5" fill="#4f46e5" fill-opacity="0.9" />
      <path d="M43 63.5H56" stroke="#ffffff" stroke-width="1" stroke-opacity="0.7" />
      <path d="M49.5 58V69" stroke="#ffffff" stroke-width="1" stroke-opacity="0.7" />

      {/* The Fill Bolt / Arrow Symbol */}
      <path
        d="M75 55L64 71H72L67 87L83 69H75L78 55H75Z"
        fill="url(#stashfill-bolt-grad)"
      />

      {/* Top-Right Emerald Offline Node */}
      <circle cx="94" cy="34" r="5.5" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    </svg>
  );
}

