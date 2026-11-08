'use client';

import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Layers, 
  FileText, 
  Languages, 
  EyeOff, 
  Keyboard
} from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Built Differently</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Engineered for Extreme Speed & Total Privacy
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Unlike cloud-based password managers or dummy text generators, Stashfill is an offline-first
            powerhouse engineered for real-world form edge cases.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Zero-Network CI Guarantee (Wide 2-col on lg) */}
          <div className="lg:col-span-2 rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-500/15 transition-all" />
            
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Guaranteed Local Isolation
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Zero Network Requests. Zero Telemetry.
                </h3>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Stashfill operates without backend servers, user accounts, or analytics tracking. 
              Our automated CI test suite executes a strict AST and source code grep verification that 
              immediately rejects any build containing <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-brand-600 dark:text-brand-400">fetch()</code>, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-brand-600 dark:text-brand-400">XMLHttpRequest</code>, or <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-brand-600 dark:text-brand-400">WebSocket</code>.
            </p>

            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>scripts/check-code-safety.mjs passed: 0 network calls</span>
              </div>
              <span className="text-[11px] text-slate-400">Exit Code: 0</span>
            </div>
          </div>

          {/* Card 2: React & Vue Value Tracker Interception */}
          <div className="rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit mb-5">
              <Cpu className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Framework Compatibility
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
              React & Vue State Reconciliation
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              Modern frontend frameworks ignore direct DOM value assignments. Stashfill overrides the native 
              input value setter descriptor, syncs React <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">_valueTracker</code>, and dispatches bubbled synthetic events.
            </p>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
              ✓ React 18/19, Vue v-model, Angular
            </div>
          </div>

          {/* Card 3: Encrypted Vault (AES-GCM 256) */}
          <div className="rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-fit mb-5">
              <Lock className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Cryptographic Hardening
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
              AES-GCM 256-Bit Encrypted Vault
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              Payment cards and confidential credentials are encrypted locally with PBKDF2-SHA256 (600,000 iterations). 
              Payment fields are never passively suggested—only filled after explicit confirmation dialog with ephemeral CVV.
            </p>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
              🛡️ 15-Sec Clipboard Auto-Clear
            </div>
          </div>

          {/* Card 4: Multilingual Heuristic Engine (English & Bangla) */}
          <div className="rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit mb-5">
              <Languages className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Multilingual Matching
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
              Native English & Bangla Synonyms
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              Tested across 65+ form fixture scenarios. Resolves tokens across autocomplete, name, id, placeholder, 
              labels, and aria-attributes with comprehensive synonyms for both English and Bangla (বাংলা).
            </p>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
              &quot;নাম&quot; ↔ Full Name | &quot;ইমেইল&quot; ↔ Email
            </div>
          </div>

          {/* Card 5: Interactive Snippets & Variable Expansion */}
          <div className="rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit mb-5">
              <FileText className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Productivity Boost
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
              Dynamic Snippets & Variables
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              Define reusable snippets with live template variables like <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">&#123;&#123;date&#125;&#125;</code>, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">&#123;&#123;time&#125;&#125;</code>, and <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">&#123;&#123;cursor&#125;&#125;</code>. Trigger instantly with quick shortcuts.
            </p>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
              ;sig → Best regards, Sarah Connor
            </div>
          </div>

          {/* Card 6: Keyboard-First & Speed (Wide 2-col on lg) */}
          <div className="lg:col-span-2 rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Sub-100ms Performance
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Keyboard-First Quick Search & Paste
                </h3>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Never lift your hands from the keyboard. The popup opens with zero delay, automatically focuses the search input, 
              and indexes 200+ fields in milliseconds. Navigate with arrow keys, press Enter to copy or fill, or press <kbd className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Esc</kbd> to dismiss.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white font-mono">&lt; 100ms</div>
                <div className="text-[11px] text-slate-500">Popup Render</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white font-mono">&lt; 32 KB</div>
                <div className="text-[11px] text-slate-500">Injected Script</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white font-mono">Alt+Shift+F</div>
                <div className="text-[11px] text-slate-500">Instant Fill Key</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white font-mono">0 Overhead</div>
                <div className="text-[11px] text-slate-500">On Host Pages</div>
              </div>
            </div>
          </div>

          {/* Card 7: Shadow DOM & Iframe Penetration */}
          <div className="rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 w-fit mb-5">
              <Layers className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              DOM Traversal
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
              Shadow DOM & Nested Iframes
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
              Penetrates open Shadow DOM boundaries, nested same-origin iframes, and modern custom elements like web components used in Salesforce and Google Forms.
            </p>

            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
              Recursive shadowRoot Walker
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
