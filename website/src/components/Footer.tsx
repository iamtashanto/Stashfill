'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Shield, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-1">
                <Image src="/icon.svg" alt="Stashfill" width={20} height={20} className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                Stash<span className="text-brand-500">fill</span>
              </span>
            </Link>

            <p className="max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The 100% offline, privacy-first autofill and quick-paste extension for your real data. 
              Zero accounts, zero trackers, zero telemetry.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/stashfill/stashfill"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <Github className="w-4 h-4" />
                <span>GitHub (MIT)</span>
              </a>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified 0-Network</span>
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Product &amp; Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#demo" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Interactive Simulator
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Bento Features
                </Link>
              </li>
              <li>
                <Link href="#security" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  AES-256 Vault Security
                </Link>
              </li>
              <li>
                <Link href="#comparison" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Comparison vs Others
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Resources &amp; Docs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/docs" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Documentation &amp; Cheatsheet
                </Link>
              </li>
              <li>
                <Link href="/install" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Browser Installation Guides
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Privacy Policy &amp; Manifesto
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/stashfill/stashfill/blob/main/THREAT_MODEL.md" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
                >
                  <span>Threat Model</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/stashfill/stashfill/releases" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
                >
                  <span>Releases &amp; Changelog</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Stashfill Team. Released under the MIT License.</p>
          <p className="flex items-center gap-1">
            Designed for privacy, speed, and freedom. Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for users everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
