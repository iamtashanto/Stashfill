'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Shield, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#07080b] border-t border-zinc-200/80 dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 dark:bg-white p-1">
                <Image src="/icon.svg" alt="Stashfill" width={16} height={16} className="w-4 h-4 invert dark:invert-0" />
              </div>
              <span className="text-sm font-bold text-zinc-950 dark:text-white">
                stashfill
              </span>
            </Link>

            <p className="max-w-sm text-xs text-zinc-500 font-sans leading-relaxed">
              Offline, zero-telemetry, privacy-first autofill browser extension. 
              Distributed under the open-source MIT license.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/stashfill/stashfill"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 text-[11px]"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                <Shield className="w-3 h-3" />
                <span>0-Telemetry CI Gate</span>
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-zinc-950 dark:text-white">
              Specifications
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/comparison" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  Technical Architecture
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  Security Vault
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  FAQ &amp; Knowledge Base
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-zinc-950 dark:text-white">
              Resources &amp; Docs
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/docs" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  Documentation &amp; Cheatsheet
                </Link>
              </li>
              <li>
                <Link href="/install" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  Browser Install Guides
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                  Privacy Policy &amp; Threat Model
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/stashfill/stashfill/blob/main/THREAT_MODEL.md" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-zinc-950 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Threat Model</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© {new Date().getFullYear()} Stashfill. Released under MIT.</p>
          <p className="text-zinc-400">
            Engineered for privacy, speed, and developer autonomy.
          </p>
        </div>
      </div>
    </footer>
  );
}
