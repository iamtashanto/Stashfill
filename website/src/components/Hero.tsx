'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Terminal, 
  Lock, 
  Zap, 
  RotateCcw, 
  ShieldCheck 
} from 'lucide-react';

export default function Hero() {
  const [filled, setFilled] = useState(false);
  const [animating, setAnimating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    address: '',
  });

  const triggerFill = () => {
    if (animating) return;
    setAnimating(true);
    
    const target = {
      name: 'Sarah Connor',
      email: 'sarah.connor@cyberdyne.io',
      phone: '+1 (415) 890-3421',
      role: 'Principal Systems Architect',
      address: '742 Evergreen Terrace, Sector 4',
    };

    const keys = Object.keys(target) as Array<keyof typeof target>;
    keys.forEach((key, i) => {
      setTimeout(() => {
        setForm((prev) => ({ ...prev, [key]: target[key] }));
        if (i === keys.length - 1) {
          setAnimating(false);
          setFilled(true);
        }
      }, (i + 1) * 70);
    });
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', role: '', address: '' });
    setFilled(false);
  };

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden tech-grid border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Technical Classification Tag */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
              Manifest V3
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">|</span>
            <span>100% Offline Sandbox</span>
            <span className="text-zinc-400 dark:text-zinc-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Zero Telemetry CI-Verified</span>
          </div>

          {/* Main Headline - Authoritative & Crisp */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.08] mb-6">
            Your real data. <br className="hidden sm:block" />
            Autocompleted locally. <br className="hidden sm:block" />
            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">
              Zero cloud. Zero telemetry.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-9 leading-relaxed">
            Stashfill stores your personal identity profiles, work credentials, snippets, and AES-256 
            encrypted cards strictly in your browser&apos;s local sandbox. Autofill React, Vue, and Shadow DOM 
            inputs in under 50 milliseconds with a single keystroke.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-12">
            <Link
              href="/install"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-sm transition-all duration-150 active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Install for Browser</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-700 rounded font-mono">
                Free • MIT
              </kbd>
            </Link>

            <Link
              href="/comparison"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-sm transition-all duration-150"
            >
              <Terminal className="w-4 h-4 text-zinc-500" />
              <span>Comparison Matrix</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-mono">
                vs Others
              </kbd>
            </Link>
          </div>

          {/* Quick Platform Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Chrome / Chromium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Firefox MV3
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Microsoft Edge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Apple Safari
            </span>
          </div>

        </div>

        {/* Real Product Interactive HUD Preview */}
        <div className="max-w-5xl mx-auto rounded-xl tech-card shadow-2xl overflow-hidden border border-zinc-300 dark:border-zinc-800">
          
          {/* Mock Browser Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 dark:text-zinc-400 w-full max-w-sm justify-center">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>https://candidate-portal.internal.corp/apply</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <span className="hidden sm:inline">Stashfill Active</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                ⌥⇧F
              </kbd>
            </div>
          </div>

          {/* Browser Workspace */}
          <div className="p-6 sm:p-8 bg-zinc-50/70 dark:bg-[#0b0d13] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Real Form */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-mono">
                    Applicant Information Form
                  </h3>
                  <p className="text-xs text-zinc-500">React 19 Controlled Form with valueTracker</p>
                </div>
                {filled ? (
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                    5 empty fields detected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>Full Legal Name</span>
                    {form.name && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        synced
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder="e.g. Sarah Connor"
                    value={form.name}
                    className={`w-full px-3 py-2 rounded-md font-mono border transition-all ${
                      form.name 
                        ? 'bg-emerald-500/[0.06] border-emerald-500/40 text-zinc-900 dark:text-white' 
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>Email Address</span>
                    {form.email && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        _valueTracker OK
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    readOnly
                    placeholder="sarah@example.com"
                    value={form.email}
                    className={`w-full px-3 py-2 rounded-md font-mono border transition-all ${
                      form.email 
                        ? 'bg-emerald-500/[0.06] border-emerald-500/40 text-zinc-900 dark:text-white' 
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>Phone (E.164)</span>
                    {form.phone && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        formatted
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    className={`w-full px-3 py-2 rounded-md font-mono border transition-all ${
                      form.phone 
                        ? 'bg-emerald-500/[0.06] border-emerald-500/40 text-zinc-900 dark:text-white' 
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>Engineering Role</span>
                    {form.role && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        matched
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder="Systems Architect"
                    value={form.role}
                    className={`w-full px-3 py-2 rounded-md font-mono border transition-all ${
                      form.role 
                        ? 'bg-emerald-500/[0.06] border-emerald-500/40 text-zinc-900 dark:text-white' 
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>Street Address</span>
                    {form.address && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        shadow DOM traversed
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder="Street, City, Postal"
                    value={form.address}
                    className={`w-full px-3 py-2 rounded-md font-mono border transition-all ${
                      form.address 
                        ? 'bg-emerald-500/[0.06] border-emerald-500/40 text-zinc-900 dark:text-white' 
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  />
                </div>
              </div>

              {/* Status bar */}
              <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Network Isolation: Verified</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  0 bytes sent
                </span>
              </div>
            </div>

            {/* Right Column: Authentic Stashfill Extension Popup HUD */}
            <div className="lg:col-span-5 rounded-xl tech-card p-4 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 shadow-xl space-y-3 font-mono">
              
              {/* HUD Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center p-1">
                    <Image src="/icon.svg" alt="Stashfill" width={16} height={16} className="w-3.5 h-3.5 invert dark:invert-0" />
                  </div>
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">stashfill</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  Tab Active
                </span>
              </div>

              {/* Instant Fill Trigger Button */}
              <button
                onClick={triggerFill}
                disabled={animating}
                className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-between transition-all active:scale-[0.98] shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${animating ? 'animate-spin' : ''}`} />
                  <span>{animating ? 'Syncing DOM...' : 'Fill All Fields'}</span>
                </span>
                <kbd className="px-1.5 py-0.5 bg-black/25 rounded text-[10px]">⌥⇧F</kbd>
              </button>

              {/* Profiles Selector */}
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Active Identity
                </div>
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-white">Sarah Connor</span>
                  <span className="text-[10px] text-zinc-400">14 fields</span>
                </div>
              </div>

              {/* Quick Search */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>Quick Filter</span>
                  <kbd className="text-[10px] px-1 bg-zinc-200 dark:bg-zinc-800 rounded">/</kbd>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                    <span>email: sarah.connor@...</span>
                    <kbd className="text-[10px] text-zinc-400">↵</kbd>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 flex items-center justify-between">
                    <span>phone: +1 (415) 890-...</span>
                    <kbd className="text-[10px] text-zinc-400">↵</kbd>
                  </div>
                </div>
              </div>

              {/* Vault State */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Vault: AES-GCM 256 Sealed</span>
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">Local Disk Only</span>
              </div>

            </div>

          </div>
        </div>

        {/* 4 Technical Benchmarks in Monospace Precision */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
          <div className="p-4 rounded-xl tech-card">
            <div className="font-mono text-2xl font-bold text-zinc-950 dark:text-white mb-0.5">0 bytes</div>
            <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">Telemetry packets</div>
          </div>
          <div className="p-4 rounded-xl tech-card">
            <div className="font-mono text-2xl font-bold text-zinc-950 dark:text-white mb-0.5">&lt; 45 ms</div>
            <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">DOM matching engine</div>
          </div>
          <div className="p-4 rounded-xl tech-card">
            <div className="font-mono text-2xl font-bold text-zinc-950 dark:text-white mb-0.5">600K rounds</div>
            <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">PBKDF2-SHA256 vault</div>
          </div>
          <div className="p-4 rounded-xl tech-card">
            <div className="font-mono text-2xl font-bold text-zinc-950 dark:text-white mb-0.5">EN + বাংলা</div>
            <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">Synonym tokenization</div>
          </div>
        </div>

      </div>
    </section>
  );
}
