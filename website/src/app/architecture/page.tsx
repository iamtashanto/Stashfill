import { Metadata } from 'next';
import BentoFeatures from '@/components/BentoFeatures';
import Link from 'next/link';
import { ArrowLeft, Cpu, FileCode2, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Technical Systems Architecture — Stashfill Runtime Engine',
  description:
    'Deep-dive into Stashfill technical architecture: React 18/19 _valueTracker descriptor reconciliation, recursive open Shadow DOM traversal, PBKDF2 WebCrypto vault, and sub-50ms heuristic matcher.',
  keywords: [
    'React form autofill technical',
    'valueTracker autofill fix',
    'Shadow DOM penetration extension',
    'browser extension architecture',
    'WXT extension framework',
  ],
  alternates: {
    canonical: 'https://stashfill.org/architecture',
  },
  openGraph: {
    title: 'Stashfill Systems Architecture & Runtime Engine',
    description:
      'How Stashfill synchronizes React controlled inputs, penetrates Shadow DOM, and achieves sub-50ms matching latency without telemetry.',
    url: 'https://stashfill.org/architecture',
  },
};

export default function ArchitecturePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Stashfill Technical Systems Architecture & Runtime Engine',
    description:
      'Detailed engineering overview of React _valueTracker synchronization, recursive shadowRoot traversal, and heuristic token matching.',
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
          
          {/* Breadcrumb Navigation */}
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
              <Cpu className="w-3.5 h-3.5" />
              <span>Internal Runtime Specifications</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-4">
              Systems Architecture &amp; Runtime Engine
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
              Explore the technical internals that enable Stashfill to populate complex React/Vue 
              single-page applications, cross open shadow DOM boundaries, and maintain strict local privacy.
            </p>
          </div>

        </div>

        {/* Systems Feature Deep-Dive Component */}
        <BentoFeatures />

        {/* Extended Architectural Details */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-8 font-sans">
          
          <div className="p-8 rounded-xl tech-card space-y-4">
            <h2 className="text-lg font-bold font-mono text-zinc-950 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>Lightweight Injected Content Script (&lt; 32 KB Gzipped)</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Stashfill does not maintain heavy observer loops or continuous page polling. The content script is injected on-demand 
              using the <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">chrome.scripting</code> API 
              strictly when you trigger a fill or open the context menu. This guarantees that host web pages experience 
              zero performance degradation or battery drain while you browse.
            </p>
          </div>

          <div className="p-8 rounded-xl tech-card space-y-4">
            <h2 className="text-lg font-bold font-mono text-zinc-950 dark:text-white flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-emerald-500" />
              <span>Automated Test Coverage (&gt;= 80% Enforcement)</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Our continuous integration pipeline enforces rigorous test gates across matcher heuristics, DOM traversal, 
              storage serialization, and cryptographic derivations. A pull request is automatically blocked if code coverage 
              falls below 80% or if any performance budget is exceeded.
            </p>
          </div>

          <div className="text-center pt-6">
            <Link
              href="/install"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <span>Install Stashfill on Your Browser →</span>
            </Link>
          </div>

        </div>

      </div>
    </>
  );
}
