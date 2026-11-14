'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Zap, 
  Lock, 
  Layers, 
  FileText, 
  Database,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface ShowcaseSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Zap;
  badge: string;
  imageSrc: string;
  description: string;
  highlights: string[];
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'autofill',
    title: '1-Click Intelligent Form Filling',
    subtitle: 'Reconciles React, Vue, & Shadow DOM controls in under 50ms',
    icon: Zap,
    badge: 'Core Runtime',
    imageSrc: '/screenshots/screenshot-1-autofill-1280x800.png',
    description:
      'Stashfill retrieves prototype value setters to trigger framework state trackers without re-render rollbacks. Whether applying for jobs, registering SaaS accounts, or purchasing online, hit Alt+Shift+F or 1-click in the popup to fill every matching field instantly.',
    highlights: [
      'React _valueTracker and Vue v-model event synchronization',
      'Context menu sub-menus for instant cross-profile paste',
      '0% CPU overhead while dormant',
    ],
  },
  {
    id: 'encrypted-vault',
    title: 'AES-GCM 256 Sealed Vault',
    subtitle: 'Client-side W3C WebCrypto with PBKDF2 (600,000 rounds)',
    icon: Lock,
    badge: 'SubtleCrypto Vault',
    imageSrc: '/screenshots/screenshot-2-encrypted-vault-1280x800.png',
    description:
      'Payment cards and sensitive credentials stay hardware-encrypted in browser local storage. Decryption keys live only in volatile memory and auto-lock upon timeout. Card numbers are protected with an ephemeral 15-second clipboard wiper.',
    highlights: [
      'Never auto-fills payment cards without explicit modal confirmation',
      'Ephemeral one-time CVV input — never written to disk',
      'Automatic clipboard scrub after 15 seconds',
    ],
  },
  {
    id: 'multi-profile',
    title: 'Multi-Profile & Quick Fields',
    subtitle: 'Separate Work, Personal, and Custom identities without switching',
    icon: Layers,
    badge: 'Identity Profiles',
    imageSrc: '/screenshots/screenshot-3-profiles-fields-1280x800.png',
    description:
      'Create unlimited distinct personas with custom tags and categories. With the new direct cross-profile search and context submenus, you can paste an email or ID from your Work profile directly from the popup or right-click menu without changing your active profile.',
    highlights: [
      'Instant top-placement for quick added fields',
      'Universal search across all profiles simultaneously',
      'Native drag-and-drop & keyboard reordering',
    ],
  },
  {
    id: 'snippets',
    title: 'Dynamic Text Snippets & Universal Quick-Paste',
    subtitle: 'Real-time trigger replacement with dynamic variables & cross-profile menus',
    icon: FileText,
    badge: 'Snippet Engine',
    imageSrc: '/screenshots/screenshot-4-multilingual-1280x800.png',
    description:
      'Automate repetitive communications, signatures, timestamps, and secure tokens. Type keyword triggers like ;sig, ;date, ;uuid directly inside any field or textarea to expand dynamic tokens in under 1 millisecond. Full UTF-8 Unicode ensures copying and pasting in any language (Bangla, Arabic, Chinese, Emoji) works seamlessly.',
    highlights: [
      'Dynamic variable templating ({{date}}, {{time}}, {{uuid}}, {{random}})',
      'Direct cross-profile right-click context menu submenus',
      'Universal Unicode & all-language copy-paste support',
    ],
  },
  {
    id: 'backups',
    title: 'Encrypted Snapshots & Local Backups',
    subtitle: 'Portable .stashfill envelopes with rolling automated backups',
    icon: Database,
    badge: 'Data Sovereignty',
    imageSrc: '/screenshots/screenshot-5-backups-snapshots-1280x800.png',
    description:
      'Export and import your entire vault in plain JSON, CSV, or password-protected encrypted archives. Automatic rolling local snapshots safeguard your data against accidental browser profile resets.',
    highlights: [
      'Encrypted .stashfill export with Argon2/PBKDF2 verification',
      'Automatic rolling local snapshots stored safely on-device',
      'Plain exports deliberately exclude payment cards for security',
    ],
  },
];

export default function ProductShowcase() {
  const [activeSlideId, setActiveSlideId] = useState<string>('autofill');

  const currentSlide = SHOWCASE_SLIDES.find((s) => s.id === activeSlideId) || SHOWCASE_SLIDES[0];
  const Icon = currentSlide.icon;

  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
              <Eye className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
              <span>Real Product Interface</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              See Stashfill in action.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mt-2">
              Authentic screenshots captured directly from our Chrome and Firefox Manifest V3 production builds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/install"
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-semibold font-mono flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span>Get Free Extension</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Interactive Feature Switcher Bar */}
        <div className="flex overflow-x-auto gap-2 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-mono mb-8 scrollbar-none">
          {SHOWCASE_SLIDES.map((slide) => {
            const SlideIcon = slide.icon;
            const isActive = slide.id === activeSlideId;
            return (
              <button
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-sm font-semibold border border-zinc-200/80 dark:border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <SlideIcon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                <span>{slide.title.split(' ')[0]} {slide.title.split(' ')[1]}</span>
                <span className="hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {slide.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Showcase Showcase Box */}
        <div className="rounded-2xl tech-card shadow-2xl overflow-hidden border border-zinc-300 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 items-center">
          
          {/* Left Details */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 bg-zinc-50/50 dark:bg-[#0c0d12] border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center p-1.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    {currentSlide.badge}
                  </span>
                  <h3 className="text-xl font-bold font-mono text-zinc-950 dark:text-white leading-tight">
                    {currentSlide.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                {currentSlide.subtitle}
              </p>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                {currentSlide.description}
              </p>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
                <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Highlights:
                </div>
                {currentSlide.highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-sans">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active in Extension v1.0</span>
              </span>
              <Link
                href="/docs"
                className="text-zinc-900 dark:text-white hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Read Manual</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right Screenshot Display */}
          <div className="lg:col-span-7 p-4 sm:p-8 bg-zinc-100/60 dark:bg-[#07080b] flex items-center justify-center">
            <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-300 dark:border-zinc-700/80 group">
              <Image
                src={currentSlide.imageSrc}
                alt={currentSlide.title}
                width={1280}
                height={800}
                priority
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10">
                1280 × 800 HD Output
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
