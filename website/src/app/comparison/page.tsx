import { Metadata } from 'next';
import ComparisonTable from '@/components/ComparisonTable';
import Link from 'next/link';
import { ArrowLeft, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Stashfill vs Traditional Autofill & Password Managers — Comparison',
  description:
    'Detailed technical comparison between Stashfill, Chrome/Safari built-in autofill, cloud password managers (1Password/Bitwarden), and FakeFiller. 100% offline with zero cloud telemetry.',
  keywords: [
    'Stashfill vs Bitwarden',
    'Stashfill vs 1Password',
    'Stashfill vs Chrome Autofill',
    'offline autofill comparison',
    'FakeFiller alternative',
    'private form filler',
  ],
  alternates: {
    canonical: 'https://stashfill.org/comparison',
  },
  openGraph: {
    title: 'Stashfill vs Others — Technical Comparison Matrix',
    description:
      'Compare Stashfill with browser autofill, cloud password managers, and FakeFiller. Offline, zero accounts, React _valueTracker sync.',
    url: 'https://stashfill.org/comparison',
  },
};

export default function ComparisonPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Stashfill vs Browser Autofill vs Cloud Managers vs FakeFiller',
    description:
      'A technical comparison of autofill extensions, privacy implications, React framework compatibility, and offline security models.',
    author: {
      '@type': 'Organization',
      name: 'Stashfill Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stashfill',
      url: 'https://stashfill.org',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb / Back Navigation */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Home</span>
            </Link>
          </nav>

          {/* Page Intro */}
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
              <Terminal className="w-3.5 h-3.5" />
              <span>Independent Evaluation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-4">
              Comparison Matrix &amp; Architectural Differences
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
              Why developers, QA engineers, and privacy purists choose an offline-first autofill utility 
              over cloud password managers, rigid browser defaults, or fake text generators.
            </p>
          </div>

        </div>

        {/* The Matrix */}
        <ComparisonTable />

        {/* Detailed Qualitative Deep-Dive */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* vs Browser Autofill */}
            <div className="p-6 rounded-xl tech-card space-y-3">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Compared to
              </span>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white font-mono">
                Chrome &amp; Safari Autofill
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Built-in browser autofill is notoriously rigid: it only fills standard address/payment forms, 
                fails completely on React controlled inputs, offers no custom reusable text snippets, and continuously syncs 
                your physical identity with your Google or Apple cloud profile.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Stashfill advantage: 100% local, multi-profile, React-compatible.
              </div>
            </div>

            {/* vs Cloud Password Managers */}
            <div className="p-6 rounded-xl tech-card space-y-3">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Compared to
              </span>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white font-mono">
                1Password &amp; Bitwarden
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Cloud password managers are designed for account credentials, not broad form population. 
                They require user accounts, subscription fees, and transmit encrypted data blobs over external sync networks. 
                Opening their popups often introduces 400ms+ latency.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Stashfill advantage: Zero accounts, instant &lt;50ms launch, free &amp; MIT.
              </div>
            </div>

            {/* vs FakeFiller */}
            <div className="p-6 rounded-xl tech-card space-y-3">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Compared to
              </span>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white font-mono">
                FakeFiller (Dummy QA)
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                FakeFiller is exceptional for populating randomized dummy lorem-ipsum data during staging tests. 
                However, for real checkouts, job applications, or official registration portals, you need your real verified identity 
                fields and AES-256 protected cards.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Stashfill advantage: Built for your real identity data.
              </div>
            </div>

          </div>

          {/* CTA Box */}
          <div className="p-8 rounded-xl tech-card border border-zinc-300 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold font-mono text-zinc-950 dark:text-white">
                Ready for high-velocity private form filling?
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-1">
                Install Stashfill on Chrome, Firefox, Edge, or compile for Safari.
              </p>
            </div>
            <Link
              href="/install"
              className="px-5 py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              Get Stashfill Now →
            </Link>
          </div>

        </div>

      </div>
    </>
  );
}
