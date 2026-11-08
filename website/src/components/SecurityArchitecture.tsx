'use client';

import { Lock, Key, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SecurityArchitecture() {
  return (
    <section id="security" className="py-24 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Hardening</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Security &amp; Threat Model You Can Trust
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            We architected Stashfill with zero trust principles: no cloud backends, minimal runtime 
            permissions, and client-side encryption derived directly in your browser.
          </p>
        </div>

        {/* Cryptographic Pipeline Diagram */}
        <div className="max-w-5xl mx-auto mb-16 p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-500" />
            <span>Vault Encryption Flow (W3C Web Cryptography API)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-7 h-7 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                User Passphrase
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Vault passphrase entered by user. Never persisted to disk in plaintext.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                PBKDF2-SHA256
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                600,000 iterations + 16-byte random cryptographic salt via <code className="text-[11px] font-mono">crypto.subtle</code>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                AES-GCM 256-Bit
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Authenticated ciphertext with unique 12-byte IV per encryption operation.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs mb-3">
                04
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Local Storage Sealed
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Encrypted payload saved in <code className="text-[11px] font-mono">chrome.storage.local</code>. Zero remote transmission.
              </p>
            </div>

          </div>
        </div>

        {/* Least Privilege Permissions Table */}
        <div className="max-w-5xl mx-auto rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Strict Least-Privilege Manifest V3 Permissions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stashfill asks for minimal access required for user-initiated actions.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>Read Full Privacy &amp; Threat Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-xs">
                  <th className="pb-3 font-semibold">Permission</th>
                  <th className="pb-3 font-semibold">Classification</th>
                  <th className="pb-3 font-semibold">Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="py-3 font-mono text-brand-600 dark:text-brand-400 font-semibold">storage</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Local Only</span></td>
                  <td className="py-3">Stores encrypted user profiles and preferences on user&apos;s physical disk.</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-brand-600 dark:text-brand-400 font-semibold">activeTab</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">User-Triggered</span></td>
                  <td className="py-3">Accesses the current tab strictly upon explicit user click or shortcut invocation.</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-brand-600 dark:text-brand-400 font-semibold">scripting</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">On-Demand</span></td>
                  <td className="py-3">Injects the lightweight 32KB autofill runtime when filling is commanded.</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-brand-600 dark:text-brand-400 font-semibold">contextMenus</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Optional</span></td>
                  <td className="py-3">Enables right-click shortcuts in input context menus.</td>
                </tr>
                <tr className="bg-rose-500/5 dark:bg-rose-950/20">
                  <td className="py-3 font-mono text-rose-600 dark:text-rose-400 font-semibold">Host Permissions (&lt;all_urls&gt;)</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">Not Requested</span></td>
                  <td className="py-3 font-semibold text-rose-700 dark:text-rose-300">NEVER requested at installation. No passive background page snooping.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
