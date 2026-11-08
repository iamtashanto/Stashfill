'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Download
} from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden gradient-mesh">
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-brand-500/10 dark:bg-brand-500/20 blur-[130px] rounded-full pointer-events-none -z-10 animate-glow-pulse" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          {/* Top Privacy Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-brand-500/30 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-8 shadow-sm hover:border-brand-500/50 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-brand-600 dark:text-brand-400">Offline-First:</span>
            <span>Zero accounts. Zero telemetry. Manifest V3 ready.</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
            1-Click Offline Autofill for Your{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 bg-clip-text text-transparent">
              Real Data
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop retyping personal profiles, work addresses, snippets, and payment cards.
            Stashfill fills any form, React input, or Shadow DOM in under 100 milliseconds — 
            <strong className="text-slate-900 dark:text-white font-semibold"> 100% locally on your device</strong>, with zero cloud servers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
            <Link
              href="/install"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-200 active:scale-95 group"
            >
              <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
              <span>Add to Browser — It&apos;s Free</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="#demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-base shadow-sm transition-all duration-200 hover:border-brand-500/40"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Try Live Interactive Demo</span>
            </Link>
          </div>

          {/* Quick Browser Compatibility badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 mb-16">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Supported Platforms:</span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Chrome &amp; Chromium
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Mozilla Firefox
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Microsoft Edge
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> Apple Safari
            </span>
          </div>

        </div>

        {/* Visual Hero Mockup Window */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glowing backplate */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 opacity-20 dark:opacity-30 blur-xl"></div>
          
          <div className="relative rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Mockup Browser Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 w-full max-w-sm justify-center">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>checkout.example.com/onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[11px] font-semibold border border-brand-500/20">
                  <Zap className="w-3 h-3" />
                  <span>Alt+Shift+F</span>
                </div>
              </div>
            </div>

            {/* Mockup Page Content & Floating Extension Popup */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-slate-50/50 dark:bg-slate-950/50">
              
              {/* Left Side: Mock Web Form */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Applicant Profile Registration</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Complex dynamic form with React 19 state synchronization</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    Live Form
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Full Name</span>
                      <span className="text-[10px] text-emerald-500 font-mono">Matched (100%)</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly 
                        value="Sarah Connor" 
                        className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 font-medium"
                      />
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-emerald-500 font-mono">_valueTracker OK</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="email" 
                        readOnly 
                        value="sarah.connor@cyberdyne.io" 
                        className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 font-medium"
                      />
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Phone Number</span>
                      <span className="text-[10px] text-emerald-500 font-mono">Formatted</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly 
                        value="+1 (555) 019-2834" 
                        className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 font-medium"
                      />
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Job Title &amp; Role</span>
                      <span className="text-[10px] text-emerald-500 font-mono">Matched</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly 
                        value="Principal Systems Architect" 
                        className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 font-medium"
                      />
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Shipping / Office Address</span>
                    <span className="text-[10px] text-brand-500 font-mono">Shadow DOM Traversed</span>
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value="742 Evergreen Terrace, Sector 4, Springfield" 
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    5 fields matched &amp; filled in 42ms
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    0 telemetry packets
                  </span>
                </div>
              </div>

              {/* Right Side: Simulated Extension Floating Card */}
              <div className="lg:col-span-5 rounded-2xl p-4 bg-white dark:bg-slate-900 border border-brand-500/30 shadow-xl shadow-brand-500/10 space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Extension Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 p-1 flex items-center justify-center">
                      <Image src="/icon.svg" alt="Stashfill" width={18} height={18} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Stashfill Quick Popup</div>
                      <div className="text-[10px] text-slate-500">v1.0.0 • 100% Offline</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active Tab
                  </span>
                </div>

                {/* Primary Fill Button */}
                <button 
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20 hover:from-brand-500 hover:to-indigo-500 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Fill All Fields
                  </span>
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded font-mono">Alt+Shift+F</kbd>
                </button>

                {/* Active Profiles Selector */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Active Profile</span>
                    <span className="text-[10px] text-brand-500">3 Saved</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sarah Connor (Primary)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">14 fields</span>
                  </div>
                </div>

                {/* Search Quick-Paste Bar */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Search &amp; Paste</span>
                    <kbd className="text-[10px] px-1 bg-slate-200 dark:bg-slate-800 rounded font-mono">/</kbd>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="px-2.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-300 flex items-center justify-between">
                      <span className="font-mono text-[11px]">email: sarah.connor@...</span>
                      <kbd className="text-[10px] text-slate-400">Enter</kbd>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span className="font-mono text-[11px]">phone: +1 (555) 019-...</span>
                      <kbd className="text-[10px] text-slate-400">Enter</kbd>
                    </div>
                  </div>
                </div>

                {/* Encrypted Vault indicator */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Encrypted Vault: Locked</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">AES-256</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
          <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mb-1">0 bytes</div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Network Telemetry Sent</div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">&lt; 100ms</div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Instant Popup Launch</div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">AES-256</div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">PBKDF2 600K Encrypted Vault</div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-3xl font-extrabold text-amber-500 mb-1">EN + বাংলা</div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Bilingual Heuristic Engine</div>
          </div>
        </div>

      </div>
    </section>
  );
}
