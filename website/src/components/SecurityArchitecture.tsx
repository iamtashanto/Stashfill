'use client';

import { Lock, Key, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SecurityArchitecture() {
  return (
    <section id="security" className="py-24 relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Hardening</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-2">
            Threat model &amp; cryptographic guarantees.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            Stashfill operates under a strict zero-trust boundary: zero cloud infrastructure, 
            zero background telemetry listeners, and hardware-level client-side key derivation.
          </p>
        </div>

        {/* Cryptographic Pipeline Flow */}
        <div className="rounded-xl tech-card p-6 sm:p-8 shadow-xl mb-12 border border-zinc-300 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-900 dark:text-white" />
              <h3 className="text-sm font-bold font-mono text-zinc-950 dark:text-white">
                W3C Web Cryptography Derivation Pipeline (AES-GCM 256)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              SubtleCrypto Standard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Step 1 */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#0c0d12] border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
              <div className="text-[10px] text-zinc-400 font-bold mb-2">01 / INPUT</div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">
                Passphrase
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Master password provided by user. Held strictly in volatile memory. Never written to disk in plaintext.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#0c0d12] border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
              <div className="text-[10px] text-zinc-400 font-bold mb-2">02 / KDF DERIVATION</div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">
                PBKDF2-SHA256
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                600,000 iterations derived via <code className="text-zinc-700 dark:text-zinc-300">crypto.subtle</code> with a 16-byte cryptographically secure random salt.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#0c0d12] border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
              <div className="text-[10px] text-zinc-400 font-bold mb-2">03 / CIPHER</div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">
                AES-GCM 256
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Authenticated encryption with unique 12-byte initialization vectors (IV) per entry for integrity verification.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#0c0d12] border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
              <div className="text-[10px] text-zinc-400 font-bold mb-2">04 / AT-REST STORAGE</div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">
                chrome.storage.local
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Sealed ciphertext saved inside browser&apos;s isolated on-disk storage sandbox. Zero remote transmission.
              </p>
            </div>

          </div>
        </div>

        {/* Manifest V3 Permissions Table */}
        <div className="rounded-xl tech-card p-6 sm:p-8 shadow-xl border border-zinc-300 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-950 dark:text-white">
                Manifest V3 Least-Privilege Runtime Permissions
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Stashfill asks for minimal access required for user-initiated actions.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1"
            >
              <span>Full Privacy Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto font-mono text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-400 text-[11px] border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2.5 font-semibold">Permission</th>
                  <th className="pb-2.5 font-semibold">Scope</th>
                  <th className="pb-2.5 font-semibold font-sans">Technical Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                <tr>
                  <td className="py-2.5 font-bold text-zinc-950 dark:text-white">storage</td>
                  <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">Local Sandbox</span></td>
                  <td className="py-2.5 font-sans text-zinc-600 dark:text-zinc-400">Stores user profiles, custom rules, and encrypted vault entries locally on disk.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-zinc-950 dark:text-white">activeTab</td>
                  <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">User Triggered</span></td>
                  <td className="py-2.5 font-sans text-zinc-600 dark:text-zinc-400">Accesses tab DOM only when user clicks popup icon or presses Alt+Shift+F.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-zinc-950 dark:text-white">scripting</td>
                  <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">On-Demand</span></td>
                  <td className="py-2.5 font-sans text-zinc-600 dark:text-zinc-400">Injects lightweight 32KB autofill engine upon explicit user command.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-zinc-950 dark:text-white">contextMenus</td>
                  <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">Optional</span></td>
                  <td className="py-2.5 font-sans text-zinc-600 dark:text-zinc-400">Provides right-click shortcuts on input fields to fill forms or paste snippets.</td>
                </tr>
                <tr className="bg-rose-500/[0.04] dark:bg-rose-950/20">
                  <td className="py-2.5 font-bold text-rose-600 dark:text-rose-400">&lt;all_urls&gt;</td>
                  <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold">Never Requested</span></td>
                  <td className="py-2.5 font-sans text-rose-700 dark:text-rose-300 font-medium">NEVER requested at installation. Zero passive background tab observation.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
