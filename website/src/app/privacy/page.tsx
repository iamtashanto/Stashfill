'use client';

import Link from 'next/link';
import { ShieldCheck, EyeOff, Lock, ArrowLeft, Terminal } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy &amp; Threat Model</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          The Zero-Telemetry Privacy Policy
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
          Stashfill is built on an uncompromising principle: <strong className="text-slate-900 dark:text-white">your identity data belongs solely to you</strong>.
          We collect zero logs, zero analytics, zero crash reports, and zero user identifiers.
        </p>
      </div>

      {/* Content sections */}
      <div className="space-y-12 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
            <EyeOff className="w-5 h-5" />
            <h2>1. Zero Network Operations</h2>
          </div>
          <p>
            Stashfill does not maintain a backend, database, authentication server, or remote sync service. 
            When you save a profile, snippet, or encrypted vault entry, it is stored strictly inside your browser&apos;s 
            local sandbox via <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">chrome.storage.local</code>.
          </p>
          <p>
            An automated CI check (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">scripts/check-code-safety.mjs</code>) 
            verifies that no outbound networking primitives exist in the production bundle:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800">
            ✓ 0 fetch calls<br />
            ✓ 0 XMLHttpRequest instances<br />
            ✓ 0 WebSocket connections<br />
            ✓ 0 dynamic eval / new Function statements<br />
            ✓ 0 remote third-party scripts or CDNs
          </div>
        </section>

        {/* Section 2 */}
        <section className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400 font-bold text-lg">
            <Lock className="w-5 h-5" />
            <h2>2. Client-Side Cryptographic Vault</h2>
          </div>
          <p>
            Sensitive payment card credentials and private custom fields are encrypted using standard W3C 
            Web Cryptography (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">crypto.subtle</code>):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-sm">
            <li><strong>Key Derivation:</strong> PBKDF2-SHA256 with 600,000 iterations and a 16-byte cryptographically secure random salt.</li>
            <li><strong>Authenticated Encryption:</strong> AES-GCM 256-bit with unique 12-byte initialization vectors (IV) for every write.</li>
            <li><strong>Auto-Locking Memory:</strong> Vault keys are wiped from in-memory runtime whenever the extension popup closes or after a period of idle inactivity.</li>
            <li><strong>Clipboard Scrubbing:</strong> Whenever card details are copied to the clipboard, a 15-second timer automatically scrubs the system clipboard.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            <ShieldCheck className="w-5 h-5" />
            <h2>3. Runtime Permissions Audit</h2>
          </div>
          <p>
            Stashfill requests only the minimal permissions required by Manifest V3 to fulfill its user-commanded autofill duty:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-sm">
            <li><code className="font-mono text-xs font-semibold">storage</code>: Persists your saved profiles locally on your computer.</li>
            <li><code className="font-mono text-xs font-semibold">activeTab</code>: Grants temporary access to the active webpage strictly when you click the popup or hit <kbd className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">Alt+Shift+F</kbd>.</li>
            <li><code className="font-mono text-xs font-semibold">scripting</code>: Executes the autofill script on demand.</li>
            <li><code className="font-mono text-xs font-semibold">contextMenus</code>: Offers right-click shortcuts in input context menus.</li>
          </ul>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            ★ Note: Broad host permissions (<code className="font-mono text-xs">&lt;all_urls&gt;</code>) are NEVER requested at installation time.
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
            <Terminal className="w-5 h-5 text-amber-500" />
            <h2>4. Complete Open Source Auditability</h2>
          </div>
          <p>
            Stashfill is distributed under the open-source MIT license. You can clone the repository, inspect 
            every line of code, run the automated test suite with over 80% coverage, and compile the extension 
            locally without relying on prebuilt binary assets.
          </p>
          <div className="pt-2">
            <a
              href="https://github.com/stashfill/stashfill"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <span>Inspect Source Code on GitHub</span>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
