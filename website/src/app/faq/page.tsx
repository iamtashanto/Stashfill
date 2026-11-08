import { Metadata } from 'next';
import FaqSection from '@/components/FaqSection';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Github } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) — Stashfill',
  description:
    'Answers to common questions about Stashfill: 100% offline verification, React & Vue compatibility, AES-256 card security, and local backup policies.',
  keywords: [
    'Stashfill FAQ',
    'offline autofill questions',
    'is Stashfill safe',
    'how does Stashfill work',
    'autofill credit card security',
  ],
  alternates: {
    canonical: 'https://stashfill.org/faq',
  },
  openGraph: {
    title: 'Stashfill — Frequently Asked Questions',
    description:
      'Answers to technical, security, and usage questions about Stashfill offline autofill.',
    url: 'https://stashfill.org/faq',
  },
};

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Stashfill really 100% offline with zero network requests?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Stashfill does not have a backend server, account database, or telemetry endpoint. Every build is verified by an automated CI script that fails if fetch, XMLHttpRequest, WebSocket, eval, or dynamic script injection appears anywhere in production source code.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why does Stashfill work on React and Vue forms when standard autofill fails?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Modern frontend frameworks (React 18/19, Vue 3, Angular) use internal value tracking trackers. Direct DOM .value assignments are ignored and reset on re-render. Stashfill retrieves the native HTMLInputElement value setter from the prototype, invokes it to synchronize the framework’s internal tracker, and dispatches bubbled synthetic input, change, and blur events.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Stashfill differ from FakeFiller?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'FakeFiller generates randomized dummy text intended for QA staging tests. Stashfill stores and populates your REAL, verified personal, work, and custom identity data for actual web checkouts, job applications, and SaaS onboarding portals.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are sensitive payment cards protected?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Payment cards and high-risk vault fields are encrypted using standard W3C Web Cryptography with PBKDF2-SHA256 (600,000 iterations) and AES-GCM 256-bit authenticated encryption. Card fields are NEVER passively auto-suggested—they are only populated after you explicitly confirm in an active dialog.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export, import, or back up my data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can export your data to plain JSON (cards stripped for safety), CSV, or a password-protected encrypted .stashfill backup file. Stashfill also maintains rolling local snapshots so you can easily restore previous states.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Stashfill completely free and open source?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Stashfill is distributed under the permissive MIT license. You can inspect every line of source code, run tests, and compile the extension locally from GitHub.',
        },
      },
    ],
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
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Knowledge Base</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
              Find technical answers about Stashfill offline architecture, cryptographic vault, 
              React DOM compatibility, and cross-browser support.
            </p>
          </div>

        </div>

        {/* FAQ Accordion Component */}
        <FaqSection />

        {/* Community & GitHub Support Box */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="p-8 rounded-xl tech-card border border-zinc-300 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left font-sans">
            <div>
              <h2 className="text-base font-bold font-mono text-zinc-950 dark:text-white">
                Have an edge-case form or a bug report?
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Open an issue or submit a pull request on our GitHub repository.
              </p>
            </div>
            <a
              href="https://github.com/stashfill/stashfill/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Issues →</span>
            </a>
          </div>
        </div>

      </div>
    </>
  );
}
