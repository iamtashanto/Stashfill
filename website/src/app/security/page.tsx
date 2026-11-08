import { Metadata } from 'next';
import SecurityArchitecture from '@/components/SecurityArchitecture';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck, Key } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security Model & Cryptographic Vault Specifications — Stashfill',
  description:
    'Comprehensive breakdown of Stashfill cryptographic implementation: PBKDF2-SHA256 (600,000 iterations), AES-GCM 256-bit vault, in-memory key scrubbing, and least-privilege Manifest V3 permissions.',
  keywords: [
    'Stashfill security',
    'AES-GCM 256 extension',
    'PBKDF2 SubtleCrypto',
    'zero telemetry security model',
    'offline autofill cryptography',
    'Manifest V3 permissions audit',
  ],
  alternates: {
    canonical: 'https://stashfill.org/security',
  },
  openGraph: {
    title: 'Stashfill Security & Threat Model',
    description:
      'W3C Web Cryptography API, PBKDF2-SHA256, AES-GCM 256, and zero-telemetry architecture.',
    url: 'https://stashfill.org/security',
  },
};

export default function SecurityPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Stashfill Cryptographic Vault & Security Architecture',
    description:
      'Technical specification of PBKDF2 key derivation, authenticated AES-GCM 256-bit storage, and zero-network security boundaries.',
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
              <Lock className="w-3.5 h-3.5" />
              <span>Cryptographic Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-4">
              Cryptographic Vault &amp; Threat Model
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
              Stashfill applies defense-in-depth principles: zero outbound network capabilities, 
              ephemeral memory lifetimes, and client-side W3C Web Cryptography for payment credentials.
            </p>
          </div>

        </div>

        {/* Security Component */}
        <SecurityArchitecture />

        {/* Extended Security Whitepaper Points */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-8 font-sans">
          
          <div className="p-8 rounded-xl tech-card space-y-4">
            <h2 className="text-lg font-bold font-mono text-zinc-950 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Why We Enforce Zero Network Operations in CI</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Many extensions begin with good intentions, but later introduce third-party analytics (like Google Analytics, Sentry, or PostHog) 
              that leak user form data, IP addresses, and page URLs. 
              Stashfill eliminates this risk structurally: our automated build gatekeeper (<code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">check-code-safety.mjs</code>) 
              fails if any network primitives exist in the production source.
            </p>
          </div>

          <div className="p-8 rounded-xl tech-card space-y-4">
            <h2 className="text-lg font-bold font-mono text-zinc-950 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              <span>Payment Card Protection Constraints</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><strong>Zero Passive Autofill:</strong> Payment cards are NEVER suggested or filled automatically. They require active manual confirmation.</li>
              <li><strong>Ephemeral CVV:</strong> The 3 or 4-digit card security code is kept only temporarily in runtime memory during active submission and is never saved to physical storage.</li>
              <li><strong>15-Second Clipboard Scrubbing:</strong> Whenever a card number or sensitive value is copied to the clipboard, an un-cancellable 15-second timer scrubs the system clipboard.</li>
              <li><strong>Plaintext Export Exclusion:</strong> When exporting your profiles to plain JSON or CSV, payment card entries are automatically stripped for safety.</li>
            </ul>
          </div>

          {/* Action Link */}
          <div className="text-center pt-6">
            <a
              href="https://github.com/stashfill/stashfill/blob/main/THREAT_MODEL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-mono font-semibold transition-colors"
            >
              <span>Read Full THREAT_MODEL.md on GitHub →</span>
            </a>
          </div>

        </div>

      </div>
    </>
  );
}
